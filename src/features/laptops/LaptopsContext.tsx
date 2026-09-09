import * as React from "react"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import { useMembers } from "../users/MembersContext"
import {
  createLaptop,
  getLaptops,
  updateLaptop,
  type CreateLaptopInput,
  type RemoteUserLaptop,
} from "./laptopsApi"
import {
  laptopHistoryFromRemote,
  LAPTOP_STATUS_CODES,
  normalizeLaptopStatus,
  type Laptop,
  type LaptopHistoryEntry,
  type LaptopStatus,
} from "./types"
import { dateValue } from "../../lib/dates"

const STORAGE_KEY = "laptrac.laptops"

interface LaptopsState {
  laptops: Laptop[]
  status: "idle" | "loading" | "loaded" | "error"
  error: string | null
}

type LaptopsAction =
  | { type: "loading" }
  | { type: "loaded"; laptops: Laptop[] }
  | { type: "error"; error: string }
  | { type: "add"; laptop: Laptop }
  | {
      type: "assign"
      id: string
      assigneeUserId: string
      assigneeEmail: string
      assigneeName: string
      entry: LaptopHistoryEntry
    }
  | { type: "unassign"; id: string; entry: LaptopHistoryEntry }
  | { type: "status"; id: string; status: LaptopStatus; entry: LaptopHistoryEntry }

function reducer(state: LaptopsState, action: LaptopsAction): LaptopsState {
  switch (action.type) {
    case "loading":
      return { ...state, status: "loading", error: null }
    case "loaded":
      return { laptops: action.laptops, status: "loaded", error: null }
    case "error":
      return { ...state, status: "error", error: action.error }
    case "add":
      return { ...state, laptops: [action.laptop, ...state.laptops] }
    case "assign":
      return {
        ...state,
        laptops: state.laptops.map((l) =>
          l.id === action.id
            ? {
                ...l,
                status: "assigned" as LaptopStatus,
                assignedToUserId: action.assigneeUserId,
                assignedToEmail: action.assigneeEmail,
                assignedToName: action.assigneeName,
                history: [action.entry, ...l.history],
              }
            : l,
        ),
      }
    case "unassign":
      return {
        ...state,
        laptops: state.laptops.map((l) =>
          l.id === action.id
            ? {
                ...l,
                status: "unassigned" as LaptopStatus,
                assignedToUserId: null,
                assignedToEmail: null,
                assignedToName: null,
                history: [action.entry, ...l.history],
              }
            : l,
        ),
      }
    case "status":
      return {
        ...state,
        laptops: state.laptops.map((l) =>
          l.id === action.id ? { ...l, status: action.status, history: [action.entry, ...l.history] } : l,
        ),
      }
  }
}

interface LaptopsContextValue {
  laptops: Laptop[]
  status: LaptopsState["status"]
  error: string | null
  refresh: () => Promise<void>
  addLaptop: (input: CreateLaptopInput) => Promise<void>
  assignLaptop: (
    id: string,
    assignee: { id: string; email: string; name: string },
    actorName: string,
  ) => Promise<void>
  unassignLaptop: (id: string, userId: string, actorName: string) => Promise<void>
  setLaptopStatus: (id: string, status: LaptopStatus, note: string, actorName: string) => Promise<void>
}

const LaptopsContext = React.createContext<LaptopsContextValue | null>(null)

export function LaptopsProvider({ children }: { children: React.ReactNode }) {
  const role = useRole()
  const { users } = useMembers()
  const [state, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<LaptopsState>(STORAGE_KEY, { laptops: [], status: "idle", error: null }),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, state)
  }, [state])

  const stateRef = React.useRef(state)
  stateRef.current = state

  // Backend laptop IDs are stable UserLaptop IDs. History remains a local overlay.
  const normalize = React.useCallback(
    (remote: RemoteUserLaptop[]): Laptop[] => {
      const existingById = new Map(stateRef.current.laptops.map((l) => [l.id, l]))
      return remote.map((r) => {
        const existing = existingById.get(r.id)
        const owner = r.userId ? users.find((u) => u.id === r.userId) : undefined
        return {
          id: r.id,
          assetName: r.assetName,
          model: r.model,
          comment: r.comment,
          assetLocation: r.assetLocation,
          employeeDepartment: r.employeeDepartment,
          condition: r.condition ?? existing?.condition ?? 0,// we are not using this for now
          price: r.price,
          currency: r.currency ?? existing?.currency ?? "NGN",
          receiptUrl: r.receiptUrl ?? r.receipt ?? existing?.receiptUrl ?? null,
          estimationUsefulLifeYear: r.estimationUsefulLifeYear ?? "",
          depreciationEstimationDate: r.depreciationEstimationDate ?? "",
          warrantyExpirationDate: r.warrantyExpirationDate ?? "",
          purchaseYear: r.purchaseYear ?? "",
          status: r.status !== null && r.status !== undefined
            ? normalizeLaptopStatus(r.status)
            : existing?.status ?? "unassigned",
          assignedToUserId: existing?.assignedToUserId ?? r.userId ?? null,
          assignedToEmail: existing?.assignedToEmail ?? r.assignedToEmail ?? owner?.emailAddress ?? null,
          assignedToName: existing?.assignedToName ?? r.assignedToName ?? owner?.fullName ?? null,
          history: [...(r.laptopHistories ?? []).map(laptopHistoryFromRemote), ...(existing?.history ?? [])]
            .reduce<LaptopHistoryEntry[]>((entries, entry) => {
              const withoutDuplicate = entries.filter((item) => item.id !== entry.id)
              return [...withoutDuplicate, entry]
            }, [])
            .sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt)),
        }
      })
    },
    [users],
  )

  // GET /api/laptops is the full company inventory — IT-only functionality (the admin laptops
  // list/detail/create flows). Non-IT users get their own laptop from /api/users/current-user
  // instead, so skip this fetch for them rather than shipping every employee's asset record to
  // every employee.
  const refresh = React.useCallback(async () => {
    if (role !== "it") {
      dispatch({ type: "loaded", laptops: [] })
      return
    }
    dispatch({ type: "loading" })
    try {
      const remote = await getLaptops()
      dispatch({ type: "loaded", laptops: normalize(remote) })
    } catch (err) {
      dispatch({ type: "error", error: getErrorMessage(err) })
    }
  }, [normalize, role])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const addLaptop = React.useCallback(
    async (input: CreateLaptopInput) => {
      await createLaptop(input)
      await refresh()
    },
    [refresh],
  )

  const assignLaptop = React.useCallback(
    async (id: string, assignee: { id: string; email: string; name: string }, actorName: string) => {
      await updateLaptop(id, { userID: assignee.id, status: LAPTOP_STATUS_CODES.assigned, comment: null })
      dispatch({
        type: "assign",
        id,
        assigneeUserId: assignee.id,
        assigneeEmail: assignee.email,
        assigneeName: assignee.name,
        entry: {
          id: generateId("history"),
          type: "assigned",
          note: `Assigned to ${assignee.name}`,
          actorName,
          createdAt: new Date().toISOString(),
          status: "assigned",
        },
      })
    },
    [],
  )

  const unassignLaptop = React.useCallback(
    async (id: string, userId: string, actorName: string) => {
      await updateLaptop(id, { userID: userId, status: LAPTOP_STATUS_CODES.unassigned, comment: null })
      dispatch({
        type: "unassign",
        id,
        entry: {
          id: generateId("history"),
          type: "unassigned",
          note: "Unassigned",
          actorName,
          createdAt: new Date().toISOString(),
          status: "unassigned",
        },
      })
    },
    [],
  )

  const setLaptopStatus = React.useCallback(
    async (id: string, status: LaptopStatus, note: string, actorName: string) => {
      await updateLaptop(id, { userID: null, status: LAPTOP_STATUS_CODES[status], comment: note })
      dispatch({
        type: "status",
        id,
        status,
        entry: {
          id: generateId("history"),
          type: "repair",
          note,
          actorName,
          createdAt: new Date().toISOString(),
          status,
        },
      })
    },
    [],
  )

  const value = React.useMemo(
    () => ({ ...state, refresh, addLaptop, assignLaptop, unassignLaptop, setLaptopStatus }),
    [state, refresh, addLaptop, assignLaptop, unassignLaptop, setLaptopStatus],
  )

  return <LaptopsContext.Provider value={value}>{children}</LaptopsContext.Provider>
}

export function useLaptops() {
  const ctx = React.useContext(LaptopsContext)
  if (!ctx) throw new Error("useLaptops must be used within LaptopsProvider")
  return ctx
}
