declare global {
  const gapi: { load: any; client?: Record<'init' | 'getToken' | 'setToken' | 'calendar', any> }
  const google: { accounts: { oauth2: { initTokenClient: any; revoke: any } } }
}

export {}
