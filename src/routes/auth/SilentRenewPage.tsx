import * as React from "react"
import { userManager } from "../../auth/oidcConfig"

// Loaded inside the hidden iframe oidc-client-ts creates for silent renew/signinSilent.
export function Component() {
  React.useEffect(() => {
    userManager.signinSilentCallback().catch(() => {
      // Parent window's signinSilent() call rejects on its own; nothing to render here.
    })
  }, [])

  return null
}
