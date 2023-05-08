/* eslint-disable no-undef */
import * as E from 'fp-ts/Either'
import * as J from 'fp-ts/Json'
import { flow, identity, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import { NonEmptyString } from 'io-ts-types'

const LOCAL_STORAGE_KEY = 'google.oauth.token'

const API_KEY = 'AIzaSyCvpiyx2eoTkiwjhBUGk6dC299j5buzfZ4'
const CLIENT_ID = '396628784843-qbl1vb8voopmtlnspi70chvkola4qlki.apps.googleusercontent.com'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

export const AuthToken = t.type({
  access_token: NonEmptyString,
  token_type: t.literal('Bearer'),
  expires_in: t.number,
  scope: NonEmptyString,
})
export type AuthToken = t.TypeOf<typeof AuthToken>

export const initAuthClient = ({
  onTokenLoaded,
  onClientLoaded,
}: {
  onTokenLoaded: (token: AuthToken) => void
  onClientLoaded: (client: any) => void
}) => {
  gapi.load('client', () => {
    gapi.client?.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] }).then(() => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (token: any) => {
          if (token.error !== undefined) {
            throw token
          }
          setAuthToken(token)
          onTokenLoaded(token)
        },
      })
      onClientLoaded(client)
    })
  })
}

export const getAuthToken = (): AuthToken | null => {
  const token = getAuthTokenFromLocalStorage()
  if (token !== null) {
    gapi.client?.setToken(token)
    return token
  }

  return gapi.client?.getToken() ?? null
}

export const revokeAuthToken = async (token: AuthToken | null) => {
  google.accounts.oauth2.revoke(token?.access_token)
  setAuthToken(null)
}

const setAuthToken = (token: AuthToken | null) => {
  gapi.client?.setToken(token)
  setAuthTokenInLocalStorage(token)
}

const getAuthTokenFromLocalStorage = (): AuthToken | null =>
  pipe(
    localStorage.getItem(LOCAL_STORAGE_KEY) ?? '',
    J.parse,
    E.chainW(
      flow(
        AuthToken.decode,
        E.mapLeft(errors => failure(errors).join(', ')),
      ),
    ),
    E.fold(err => {
      console.warn(`Could not retrieve auth token from local storage: ${err}`)
      return null
    }, identity),
  )

const setAuthTokenInLocalStorage = (token: AuthToken | null) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(token))
  } catch (err) {
    console.error(`Could not store auth token in local storage: ${(err as Error).message}`)
  }
}
