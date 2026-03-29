const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatDisplayDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return displayDateFormatter.format(date);
}
