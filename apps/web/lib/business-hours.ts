/** Postgres TIME is serialized on a UTC anchor date; it represents the local clock time. */
export function formatBusinessTime(value: string): string {
  const time = value.match(/(?:^|T)([0-2]\d:[0-5]\d)(?::|$)/)?.[1];
  return time && Number(time.slice(0, 2)) < 24 ? time : 'Consultar';
}
