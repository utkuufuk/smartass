import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useState } from 'react'

import reactLogo from '/react.svg'
import viteLogo from '/vite.svg'

import './App.css'
import * as gcal from '../integrations/google-calendar'

const CALENDAR_IDS = [
  `${'utku'}${'ufuk'}${'@'}${'gmail'}${'.'}${'com'}`,
  `${'utku'}${'@'}${'portchain'}${'.'}${'com'}`,
]
const MAX_EVENT_SUMMARY_LENGTH = 25

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
    const maxSourceLength = Math.max(...allEvents.map(e => stringifyEventSource(e).length))
    return allEvents.length === 0
      ? 'No events found.'
      : allEvents
          .sort((a, b) => (a.start.dateTime > b.start.dateTime ? 1 : -1))
          .reduce((str, event) => `${str}${formatEvent(event, maxSourceLength)}\n`, '')
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

const formatEvent = (event: gcal.CalendarEvent, maxEventSourceLength: number) => {
  const start = event.start.dateTime
  const end = event.end.dateTime
  const date = start.toString().slice(4, 10)
  const startStr = start.toLocaleTimeString('tr-TR').slice(0, 5)
  const endStr = end.toLocaleTimeString('tr-TR').slice(0, 5)
  const source =
    stringifyEventSource(event).toUpperCase() +
    ' '.repeat(maxEventSourceLength - stringifyEventSource(event).length)
  let summary = event.summary ?? '<private>'
  summary =
    summary.length > MAX_EVENT_SUMMARY_LENGTH
      ? `${summary.slice(0, MAX_EVENT_SUMMARY_LENGTH - 3)}...`
      : summary + ' '.repeat(MAX_EVENT_SUMMARY_LENGTH - summary.length)
  return `${date} | ${startStr}-${endStr} | ${source} | ${summary}`
}

const stringifyEventSource = (event: gcal.CalendarEvent) =>
  event.calendarId.split('@')[1].split('.')[0]
