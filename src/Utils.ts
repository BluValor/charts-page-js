export function timestampMsToDateString(timestampMs: number) {
  const date = new Date(timestampMs);
  // const timeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' });
  // return timeFormat.format(date);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}