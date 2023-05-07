/* eslint-disable no-undef */
import { useEffect, useState } from 'react'

import reactLogo from '/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

declare global {
  const gapi: { load: any; client?: Record<'init' | 'getToken' | 'setToken' | 'calendar', any> }
  const google: { accounts: { oauth2: { initTokenClient: any; revoke: any } } }
}

const API_KEY = 'AIzaSyCvpiyx2eoTkiwjhBUGk6dC299j5buzfZ4'
const CLIENT_ID = '396628784843-qbl1vb8voopmtlnspi70chvkola4qlki.apps.googleusercontent.com'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

export const App = () => {
  const [googleClient, setGoogleClient] = useState<any>(null)
  const [events, setEvents] = useState<Array<any>>([])
  const authToken = gapi.client?.getToken() ?? null

  useEffect(() => {
    gapi.load('client', () => {
      gapi.client?.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] }).then(() => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (res: any) => {
            if (res.error !== undefined) {
              throw res
            }
            gapi.client?.setToken(res)
            fetchUpcomingEvents()
          },
        })
        setGoogleClient(client)
      })
    })
  }, [])

  const handleAuth = () => googleClient.requestAccessToken({ prompt: 'consent' })

  const handleSignout = () => {
    google.accounts.oauth2.revoke(authToken.access_token)
    gapi.client?.setToken(null)
    setEvents([])
  }

  const fetchUpcomingEvents = () => {
    gapi.client?.calendar.events
      .list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      })
      .then((response: any) => setEvents(response.result.items))
      .catch((err: unknown) => console.error('Could not load upcoming calendar events:', err))
  }

  const listEvents = () =>
    events.length === 0
      ? 'No events found.'
      : events.reduce(
          (str, event) => `${str}${event.summary} (${event.start.dateTime ?? event.start.date})\n`,
          'Events:\n',
        )

  return (
    <>
      <div>
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>

      {authToken === null ? (
        <button onClick={handleAuth}>Authorize</button>
      ) : (
        <button onClick={fetchUpcomingEvents}>Refresh</button>
      )}

      {authToken !== null && (
        <>
          <button onClick={handleSignout}>Sign Out</button>
          <pre>{listEvents()}</pre>
        </>
      )}
    </>
  )
}
