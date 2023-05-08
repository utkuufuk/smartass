import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useState } from 'react'

import reactLogo from '/react.svg'
import viteLogo from '/vite.svg'

import './App.css'
import * as gcal from './google-calendar'

const CALENDAR_IDS = ['primary', `${'utku'}${'@'}${'portchain'}${'.'}${'com'}`]

export const App = () => {
  const [authClient, setAuthClient] = useState<any>(null)
  const [events, setEvents] = useState<Record<string, ReadonlyArray<gcal.CalendarEvent>>>({})

  const authToken = gcal.getAuthToken()

  const fetchUpcomingEvents = useCallback(
    () => Promise.all(CALENDAR_IDS.map(id => fetchCalendarEvents(id))),
    [],
  )

  useEffect(() => {
    gcal.initAuthClient({
      onTokenLoaded: fetchUpcomingEvents,
      onClientLoaded: setAuthClient,
    })
  }, [fetchUpcomingEvents])

  const handleAuthorize = () => authClient.requestAccessToken({ prompt: 'consent' })

  const handleSignout = () => {
    gcal.revokeAuthToken(authToken)
    setEvents({})
  }

  const fetchCalendarEvents = async (calendarId: string) => {
    const timeMin = new Date()
    const timeMax = new Date()
    timeMax.setDate(timeMin.getDate() + 4)
    pipe(
      await gcal.fetchEvents({ calendarId, timeMin, timeMax }),
      E.fold(
        err => console.error(`Could not load events for ${calendarId} calendar: ${err}`),
        events => setEvents(prevEvents => ({ ...prevEvents, [calendarId]: events })),
      ),
    )
  }

  const stringifyEvents = () => {
    const allEvents = Object.values(events).flat()
    return allEvents.length === 0
      ? 'No events found.'
      : allEvents
          .sort((a, b) => (a.start.dateTime > b.start.dateTime ? 1 : -1))
          .reduce((str, event) => `${str}${gcal.formatEvent(event)}\n`, '')
  }

  return (
    <>
      <div>
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <img src={reactLogo} className="logo react" alt="React logo" />
      </div>
      {authToken === null && <button onClick={handleAuthorize}>Authorize</button>}{' '}
      {authToken !== null && (
        <>
          <button onClick={fetchUpcomingEvents}>Refresh</button>
          <button onClick={handleSignout}>Sign Out</button>
          <h4>Events</h4>
          <pre>{stringifyEvents()}</pre>
        </>
      )}
    </>
  )
}
