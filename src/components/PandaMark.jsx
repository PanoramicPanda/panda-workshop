export default function PandaMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="10" fill="var(--panda-ear)" />
      <circle cx="48" cy="16" r="10" fill="var(--panda-ear)" />
      <circle cx="32" cy="35" r="24" fill="var(--panda-face)" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="22.5" cy="33" rx="6" ry="7.5" transform="rotate(-20 22.5 33)" fill="currentColor" />
      <ellipse cx="41.5" cy="33" rx="6" ry="7.5" transform="rotate(20 41.5 33)" fill="currentColor" />
      <circle cx="23.5" cy="32" r="2" fill="var(--panda-face)" />
      <circle cx="40.5" cy="32" r="2" fill="var(--panda-face)" />
      <ellipse cx="32" cy="44" rx="4" ry="3" fill="currentColor" />
    </svg>
  );
}
