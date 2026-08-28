import * as React from "react"
import { generateId } from "../../lib/id"
import { loadState, saveState } from "../../lib/persist"
import { mockLaptops } from "./mockLaptops"
import type { Laptop, LaptopHistoryEntry, LaptopStatus } from "./types"

const STORAGE_KEY = "laptrac.laptops"

type LaptopsAction =
  | { type: "add"; laptop: Laptop }
  | { type: "assign"; id: string; assigneeEmail: string; assigneeName: string; entry: LaptopHistoryEntry }
  | { type: "unassign"; id: string; entry: LaptopHistoryEntry }
  | { type: "status"; id: string; status: LaptopStatus; entry: LaptopHistoryEntry }

function reducer(state: Laptop[], action: LaptopsAction): Laptop[] {
  switch (action.type) {
    case "add":
      return [action.laptop, ...state]
    case "assign":
      return state.map((l) =>
        l.id === action.id
          ? {
              ...l,
              status: "assigned" as LaptopStatus,
              assignedToEmail: action.assigneeEmail,
              assignedToName: action.assigneeName,
              history: [action.entry, ...l.history],
            }
          : l,
      )
    case "unassign":
      return state.map((l) =>
        l.id === action.id
          ? {
              ...l,
              status: "available" as LaptopStatus,
              assignedToEmail: null,
              assignedToName: null,
              history: [action.entry, ...l.history],
            }
          : l,
      )
    case "status":
      return state.map((l) =>
        l.id === action.id ? { ...l, status: action.status, history: [action.entry, ...l.history] } : l,
      )
  }
}

interface AddLaptopInput {
  brand: string
  model: string
  os: string
  serialNumber: string
}

interface LaptopsContextValue {
  laptops: Laptop[]
  addLaptop: (input: AddLaptopInput) => Laptop
  assignLaptop: (id: string, assignee: { email: string; name: string }, actorName: string) => void
  unassignLaptop: (id: string, actorName: string) => void
  setLaptopStatus: (id: string, status: LaptopStatus, note: string, actorName: string) => void
}

const LaptopsContext = React.createContext<LaptopsContextValue | null>(null)

export function LaptopsProvider({ children }: { children: React.ReactNode }) {
  const [laptops, dispatch] = React.useReducer(reducer, undefined, () =>
    loadState<Laptop[]>(STORAGE_KEY, mockLaptops),
  )

  React.useEffect(() => {
    saveState(STORAGE_KEY, laptops)
  }, [laptops])

  const addLaptop = React.useCallback((input: AddLaptopInput) => {
    const laptop: Laptop = {
      id: generateId("laptop"),
      brand: input.brand,
      model: input.model,
      os: input.os,
      serialNumber: input.serialNumber,
      status: "available",
      assignedToEmail: null,
      assignedToName: null,
      history: [],
    }
    dispatch({ type: "add", laptop })
    return laptop
  }, [])

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
    () => ({ laptops, addLaptop, assignLaptop, unassignLaptop, setLaptopStatus }),
    [laptops, addLaptop, assignLaptop, unassignLaptop, setLaptopStatus],
  )

  return <LaptopsContext.Provider value={value}>{children}</LaptopsContext.Provider>
}

export function useLaptops() {
  const ctx = React.useContext(LaptopsContext)
  if (!ctx) throw new Error("useLaptops must be used within LaptopsProvider")
  return ctx
}
