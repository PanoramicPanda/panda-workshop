import Redacted from './Redacted.jsx';
import { noteParts } from '../lib/text.js';

export default function Note({ text, hideSpoilers }) {
  return (
    <p className="note">
      {noteParts(text).map((part, i) =>
        part.spoiler ? <Redacted key={i} text={part.text} hidden={hideSpoilers} inline /> : part.text,
      )}
    </p>
  );
}
