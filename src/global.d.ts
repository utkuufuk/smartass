export type InitTokenClientArgs = {
  client_id: string
  scope: string

  callback: (any) => Promise<any>
}

declare global {
  const gapi: {
    load: (name: string, callback: () => void) => void
    client?: Record<'init' | 'getToken' | 'setToken' | 'calendar', any>
  }

  const google: {
    accounts: {
      oauth2: {
        initTokenClient: (InitTokenClientArgs) => any
        revoke: (string) => void
      }
    }
  }
}
