import { useRef } from 'react';
import md from '../../CHANGELOG.md?raw';
import { parseChangelog, versionOf } from '../lib/changelog.js';

const version = versionOf(md);
const blocks = parseChangelog(md);

const Text = ({ parts }) =>
  parts.map((p, i) => (typeof p === 'string' ? p : <b key={i}>{p.bold}</b>));

/** The version number beside the title; clicking it opens CHANGELOG.md in a dialog. */
export default function Changelog() {
  const ref = useRef(null);
  const close = () => ref.current?.close();
  return (
    <>
      <button type="button" className="version" onClick={() => ref.current?.showModal()} title="What's new">
        v{version}
      </button>
      {/* Clicking the backdrop (the dialog itself, outside its box) closes it. */}
      <dialog ref={ref} className="modal" onClick={(e) => e.target === ref.current && close()}>
        <div className="modal-head">
          <h2>Changelog</h2>
          <button type="button" className="btn" onClick={close}>
            Close
          </button>
        </div>
        <div className="modal-body">
          {blocks.map((b, i) => {
            if (b.type === 'h') return <h3 key={i}><Text parts={b.text} /></h3>;
            if (b.type === 'ul')
              return (
                <ul key={i}>
                  {b.items.map((item, j) => (
                    <li key={j}><Text parts={item} /></li>
                  ))}
                </ul>
              );
            return <p key={i}><Text parts={b.text} /></p>;
          })}
        </div>
      </dialog>
    </>
  );
}
