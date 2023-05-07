/* eslint-disable no-undef */
import { useCallback, useEffect, useState } from 'react'

import reactLogo from '/react.svg'
import viteLogo from '/vite.svg'

import './App.css'
import { Event, formatEvent } from './event'

declare global {
  const gapi: { load: any; client?: Record<'init' | 'getToken' | 'setToken' | 'calendar', any> }
  const google: { accounts: { oauth2: { initTokenClient: any; revoke: any } } }
}

const API_KEY = 'AIzaSyCvpiyx2eoTkiwjhBUGk6dC299j5buzfZ4'
const CLIENT_ID = '396628784843-qbl1vb8voopmtlnspi70chvkola4qlki.apps.googleusercontent.com'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const CALENDAR_IDS = ['primary', `${'utku'}${'@'}${'portchain'}${'.'}${'com'}`]

export const App = () => {
  const [googleClient, setGoogleClient] = useState<any>(null)
  const [events, setEvents] = useState<Record<string, Array<Event>>>({})
  const authToken = gapi.client?.getToken() ?? null

  const fetchUpcomingEvents = useCallback(
    () => Promise.all(CALENDAR_IDS.map(id => fetchCalendarEvents(id))),
    [],
  )

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
  }, [fetchUpcomingEvents])

  const handleAuth = () => googleClient.requestAccessToken({ prompt: 'consent' })

  const handleSignout = () => {
    google.accounts.oauth2.revoke(authToken.access_token)
    gapi.client?.setToken(null)
    setEvents({})
  }

  const fetchCalendarEvents = (calendarId: string) => {
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMin.getDate() + 4)

    gapi.client?.calendar.events
      .list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      })
      .then((response: any) => {
        const events = response.result.items.filter(
          (e: any) => e.start.dateTime !== undefined && e.end.dateTime !== undefined,
        )
        setEvents(prevEvents => ({ ...prevEvents, [calendarId]: events }))
      })
      .catch((err: unknown) =>
        console.error(
          `Could not load upcoming events for ${calendarId} calendar: ${(err as Error).message}`,
        ),
      )
  }

  const listAllEvents = () => {
    const allEvents = Object.values(events).flat()
    return allEvents.length === 0
      ? 'No events found.'
      : allEvents
          .sort((a, b) => a.start.dateTime.localeCompare(b.start.dateTime))
          .reduce((str, event) => `${str}${formatEvent(event)}\n`, '')
  }

  return (
    <>
      <div>
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      {authToken === null && <button onClick={handleAuth}>Authorize</button>}{' '}
      {authToken !== null && (
        <>
          <button onClick={fetchUpcomingEvents}>Refresh</button>
          <button onClick={handleSignout}>Sign Out</button>
          <h4>Events</h4>
          <pre>{listAllEvents()}</pre>
        </>
      )}
    </>
  )
}
