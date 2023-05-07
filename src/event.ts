export interface Event {
  summary: string
  start: { dateTime: string }
  end: { dateTime: string }
  visibility?: 'private'
}

export const formatEvent = (event: Event) => {
  const start = new Date(event.start.dateTime)
  const end = new Date(event.end.dateTime)
  const date = start.toString().slice(4, 10)
  return `[${event.visibility === 'private' ? 'W' : 'P'}] ${event.summary} | ${date} ${start
    .toLocaleTimeString('tr-TR')
    .slice(0, 5)}-${end.toLocaleTimeString('tr-TR').slice(0, 5)}`
}
