import { useEffect, useState } from 'react';

/**
 * Spoiler text that shows as a black bar while spoilers are hidden.
 * Clicking (or Enter/Space) reveals just this one; flipping the global toggle resets it.
 */
export default function Redacted({ text, hidden, inline = false }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(false), [hidden]);
  const cls = 'why' + (inline ? ' sp' : '');

  if (!hidden || revealed) return <span className={cls}>{text}</span>;

  const reveal = () => setRevealed(true);
  return (
    <span
      className={cls + ' red'}
      role="button"
      tabIndex={0}
      title="Redacted. Click to reveal this one."
      style={{ width: `${Math.min(Math.max(text.length * 0.5, 5), 40)}em` }}
      onClick={reveal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          reveal();
        }
      }}
    >
      redacted
    </span>
  );
}
