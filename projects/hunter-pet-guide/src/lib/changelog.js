/** The version is the first heading's leading word, e.g. "## 2.3.0 — 2026-11-15" gives "2.3.0". */
export const versionOf = (md) => md.match(/^#{1,6}\s+(\S+)/m)?.[1] ?? '';

/** Splits "some **bold** text" into strings and { bold } parts. */
const inline = (text) => text.split(/\*\*(.+?)\*\*/g).map((t, i) => (i % 2 ? { bold: t } : t));

/**
 * Parses the small slice of Markdown the changelog uses (headings, "- " lists, paragraphs, **bold**)
 * into blocks: { type: 'h', level, text } | { type: 'ul', items } | { type: 'p', text },
 * where each text is a list of strings and { bold } parts.
 */
export function parseChangelog(md) {
  const blocks = [];
  let para = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);
    if (!line) {
      para = null;
    } else if (h) {
      para = null;
      blocks.push({ type: 'h', level: h[1].length, text: inline(h[2]) });
    } else if (li) {
      para = null;
      const last = blocks.at(-1);
      if (last?.type === 'ul') last.items.push(inline(li[1]));
      else blocks.push({ type: 'ul', items: [inline(li[1])] });
    } else if (para) {
      para.raw += ` ${line}`;
      para.text = inline(para.raw);
    } else {
      para = { type: 'p', raw: line, text: inline(line) };
      blocks.push(para);
    }
  }
  return blocks.map(({ raw, ...b }) => b);
}
