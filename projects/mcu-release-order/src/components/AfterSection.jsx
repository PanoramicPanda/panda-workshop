import Redacted from './Redacted.jsx';
import { displayName } from '../lib/catalog.js';

/** Titles marked `after`: the next release, which sits outside the chart. */
export default function AfterSection({ titles, catalog, hideSpoilers }) {
  return titles.map((t) => (
    <section className="after" id={`r-${t.id}`} key={t.id}>
      <h2>Next, outside this chart</h2>
      <p>
        <b>{t.title}</b> arrives {t.date}, about five weeks after VisionQuest’s finale.
        {(t.leadIns ?? []).map((lead, i) => (
          <span key={lead.from}>
            {' '}
            {i === 0 ? `${catalog.byId[lead.from].title} leads into it: ` : `So does ${displayName(catalog.byId[lead.from])}: `}
            <Redacted text={lead.text} hidden={hideSpoilers} inline />
          </span>
        ))}
      </p>
    </section>
  ));
}
