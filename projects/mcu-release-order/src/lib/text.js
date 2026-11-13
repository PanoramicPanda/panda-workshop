/** Splits "plain text {{spoiler}} more text" into text and spoiler parts. */
export function noteParts(text) {
  return text
    .split(/(\{\{.*?\}\})/)
    .filter(Boolean)
    .map((part) => (part.startsWith('{{') ? { spoiler: true, text: part.slice(2, -2) } : { spoiler: false, text: part }));
}

/** The note as a reader currently sees it: spoilers become "redacted" while hidden. */
export function visibleNote(text, hideSpoilers) {
  return noteParts(text)
    .map((p) => (p.spoiler && hideSpoilers ? 'redacted' : p.text))
    .join('');
}
