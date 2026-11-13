import PandaMark from './PandaMark.jsx';

export default function Header({ count }) {
  return (
    <header className="site-header">
      <div className="brand">
        <PandaMark className="brand-mark" />
        <span className="brand-name">Panda Workshop</span>
      </div>
      <div className="intro">
        <h1>Little tools, curious experiments, and things I’ve made.</h1>
        <p>
          A small shelf of handmade web projects — useful utilities, playful experiments, and tiny standalone apps.
          Everything here runs right in your browser.
        </p>
        {count > 0 && (
          <p className="intro-stat">
            <span>{count}</span> {count === 1 ? 'project' : 'projects'} on the bench
          </p>
        )}
      </div>
    </header>
  );
}
