/* eslint-disable no-undef */
import { useEffect, useState } from 'react'

import reactLogo from '/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

declare global {
  const gapi: any
  const google: any
}

const App = () => {
  const [events, setEvents] = useState<Array<any>>([])
  const [authButtonText, setAuthButtonText] = useState('Authorize')
  const [showSignOutButton, setShowSignOutButton] = useState(false)
  const [isGapiScriptLoaded, setGapiScriptLoaded] = useState(false)
  const [googleClient, setGoogleClient] = useState<any>(null)

  useEffect(() => {
    const root = document.querySelector('#root')
    if (root === null) {
      console.error('[App.tsx - useEffect]: Could not load the root HTML element')
      return
    }

    root.addEventListener('gapiInited', () => {
      console.log('[App.tsx - useEffect]: Google API client loaded event received.')
      setGapiScriptLoaded(true)
    })
    root.addEventListener('gisInited', ({ detail }: any) => {
      console.log(
        `[App.tsx - useEffect]: Google Identity Service client loaded event received: ${JSON.stringify(
          detail,
        )}`,
      )
      console.log(
        `[App.tsx - useEffect]: Setting googleClient: ${JSON.stringify(detail.googleClient)}`,
      )
      detail.googleClient.callback = async (res: any) => {
        if (res.error !== undefined) {
          throw res
        }
        gapi.client.setToken(res)
        setShowSignOutButton(true)
        setAuthButtonText('Refresh')
        fetchEvents()
      }
      setGoogleClient(detail.googleClient)
    })
  }, [])

  const handleAuthClick = () => {
    fetchEvents()

    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    // Skip display of account chooser and consent dialog for an existing session.
    console.log(
      `[App.tsx - handleAuthClick]: Existing token: ${JSON.stringify(gapi.client.getToken())}`,
    )
    if (gapi.client.getToken() === null) {
      googleClient.requestAccessToken({ prompt: 'consent' })
    }
    console.log(`[App.tsx - handleAuthClick]: New token: ${JSON.stringify(gapi.client.getToken())}`)
  }

  const fetchEvents = () => {
    gapi.client.calendar.events
      .list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime',
      })
      .then((response: any) => setEvents(response.result.items))
      .catch((err: unknown) => {
        console.error(
          '[App.tsx - fetchEvents]: Could not load calendar events:',
          JSON.stringify(err),
        )
      })
  }

  /**
   *  Sign out the user upon button click.
   */
  const handleSignoutClick = () => {
    const token = gapi.client.getToken()
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token)
      gapi.client.setToken('')
      setEvents([])
      setAuthButtonText('Authorize')
      setShowSignOutButton(false)
    }
  }

  // Prints the summary and start datetime/date of the events in the authorized user's calendar.
  const listUpcomingEvents = () =>
    events.length === 0
      ? 'No events found.'
      : events.reduce(
          (str, event) => `${str}${event.summary} (${event.start.dateTime ?? event.start.date})\n`,
          'Events:\n',
        )

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      {isGapiScriptLoaded && googleClient !== null && (
        <button onClick={handleAuthClick}>{authButtonText}</button>
      )}

      {showSignOutButton && <button onClick={handleSignoutClick}>Sign Out</button>}
      <pre>{listUpcomingEvents()}</pre>
    </>
  )
}

export default App
