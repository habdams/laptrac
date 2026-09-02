export interface AuthUser {
  sub: string
  email: string
  name: string
  role: "it" | "employee"
}

export type AuthState =
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }
