const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

/**
 * Sortable number for a title's (first) release date, e.g. "Jan 15 – Mar 5, 2021" → 20210115.
 * Titles whose `date` isn't a real date (the One-Shots: "Set after Iron Man 2") set `sortKey`.
 * Returns NaN when the date can't be parsed.
 */
export function startKey(title) {
  if (title.sortKey != null) return title.sortKey;
  const first = title.date.split(' – ')[0];
  const ownYear = first.match(/(\d{4})/);
  const endYear = title.date.match(/(\d{4})\s*$/);
  const year = ownYear ? +ownYear[1] : endYear ? +endYear[1] : NaN;
  const md = title.date.match(/([A-Z][a-z]{2}) (\d{1,2})/);
  if (!md || !(md[1] in MONTHS)) return NaN;
  return year * 10000 + (MONTHS[md[1]] + 1) * 100 + +md[2];
}
