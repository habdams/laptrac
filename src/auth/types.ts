export interface AuthUser {
  sub: string
  email: string
  name: string
}

export type AuthState =
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }
