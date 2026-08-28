import type { AuthUser } from "./types"

// Stand-ins for OIDC-authenticated identities. In a real deployment these
// claims would come back from the IdP's ID token after redirect.
export const mockPersonas: AuthUser[] = [
  {
    sub: "user-1",
    email: "jane.doe@laptrac.dev",
    name: "Jane Doe",
  },
  {
    sub: "user-2",
    email: "bob.smith@laptrac.dev",
    name: "Bob Smith",
  },
  {
    sub: "user-3",
    email: "amara.okafor@laptrac.dev",
    name: "Amara Okafor",
  },
]
