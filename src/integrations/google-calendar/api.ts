import * as E from 'fp-ts/Either'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import { NonEmptyString } from 'io-ts-types'
import { DateFromString } from 'io-ts-types-ext'

const Timestamp = t.type({ dateTime: DateFromString }, 'Timestamp')

export const CalendarEvent = t.intersection(
  [
    t.type({
      calendarId: NonEmptyString,
      start: Timestamp,
      end: Timestamp,
    }),
    t.partial({
      summary: NonEmptyString,
    }),
  ],
  'CalendarEvent',
)
export type CalendarEvent = t.TypeOf<typeof CalendarEvent>

export const fetchEvents = async ({
  calendarId,
  timeMin,
  timeMax,
  showDeleted = false,
  singleEvents = true,
  orderBy = 'startTime',
}: {
  calendarId: string
  timeMin: Date
  timeMax: Date
  showDeleted?: boolean
  singleEvents?: boolean
  orderBy?: 'startTime'
}): Promise<E.Either<string, ReadonlyArray<CalendarEvent>>> => {
  try {
    // eslint-disable-next-line no-undef
    const response = await gapi.client?.calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      showDeleted,
      singleEvents,
      orderBy,
    })

    return pipe(
      response.result.items,
      RA.filter((e: any) => e.start.dateTime !== undefined && e.end.dateTime !== undefined),
      RA.map((e: any) => ({ ...e, calendarId })),
      t.array(CalendarEvent).decode,
      E.mapLeft(errors => failure(errors).join(', ')),
    )
  } catch (err) {
    return E.left((err as Error).message)
  }
}
