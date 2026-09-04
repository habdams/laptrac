import * as React from "react"
import { useRole } from "../../auth/useRole"
import { getErrorMessage } from "../../lib/errors"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import { useMembers } from "../users/MembersContext"
import { createLaptop, getLaptops, type CreateLaptopInput, type RemoteUserLaptop } from "./laptopsApi"
import type { Laptop, LaptopHistoryEntry, LaptopStatus } from "./types"

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
  | { type: "assign"; id: string; assigneeEmail: string; assigneeName: string; entry: LaptopHistoryEntry }
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
                status: "available" as LaptopStatus,
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
  addLaptop: (userId: string, input: CreateLaptopInput) => Promise<void>
  assignLaptop: (id: string, assignee: { email: string; name: string }, actorName: string) => void
  unassignLaptop: (id: string, actorName: string) => void
  setLaptopStatus: (id: string, status: LaptopStatus, note: string, actorName: string) => void
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

  // Backend has no laptop `id`, assign/unassign/status/history endpoints, or serial-number/OS
  // concept — those stay as a local overlay, keyed by userID, layered on top of each fetch.
  const normalize = React.useCallback(
    (remote: RemoteUserLaptop[]): Laptop[] => {
      const existingById = new Map(stateRef.current.laptops.map((l) => [l.id, l]))
      return remote.map((r) => {
        const existing = existingById.get(r.userID)
        const owner = users.find((u) => u.id === r.userID)
        return {
          id: r.userID,
          assetName: r.assetName,
          model: r.model,
          comment: r.comment,
          assetLocation: r.assetLocation,
          employeeDepartment: r.employeeDepartment,
          condition: r.condition,
          price: r.price,
          estimationUsefulLifeYear: r.estimationUsefulLifeYear ?? "",
          depreciationEstimationDate: r.depreciationEstimationDate ?? "",
          warrantyExpirationDate: r.warrantyExpirationDate ?? "",
          purchaseYear: r.purchaseYear ?? "",
          status: existing?.status ?? "assigned",
          assignedToEmail: existing?.assignedToEmail ?? owner?.emailAddress ?? null,
          assignedToName: existing?.assignedToName ?? owner?.fullName ?? null,
          history: existing?.history ?? [],
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
    async (userId: string, input: CreateLaptopInput) => {
      await createLaptop(userId, input)
      await refresh()
    },
    [refresh],
  )

  const assignLaptop = React.useCallback(
    (id: string, assignee: { email: string; name: string }, actorName: string) =>
      dispatch({
        type: "assign",
        id,
        assigneeEmail: assignee.email,
        assigneeName: assignee.name,
        entry: {
          id: generateId("history"),
          type: "assigned",
          note: `Assigned to ${assignee.name}`,
          actorName,
          createdAt: new Date().toISOString(),
        },
      }),
    [],
  )

  const unassignLaptop = React.useCallback(
    (id: string, actorName: string) =>
      dispatch({
        type: "unassign",
        id,
        entry: {
          id: generateId("history"),
          type: "unassigned",
          note: "Unassigned",
          actorName,
          createdAt: new Date().toISOString(),
        },
      }),
    [],
  )

  const setLaptopStatus = React.useCallback(
    (id: string, status: LaptopStatus, note: string, actorName: string) =>
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
        },
      }),
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
