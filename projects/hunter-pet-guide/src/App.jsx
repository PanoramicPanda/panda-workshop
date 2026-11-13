import { useEffect, useMemo, useState } from 'react';
import { catalog as c } from './catalog.js';
import { buildPlanA, buildPlanB } from './lib/plans.js';
import { useStored } from './lib/storage.js';
import Header from './components/Header.jsx';
import Controls from './components/Controls.jsx';
import Tabs, { TABS } from './components/Tabs.jsx';
import OverviewPanel from './components/OverviewPanel.jsx';
import PlanPanel from './components/PlanPanel.jsx';
import SpeedPanel from './components/SpeedPanel.jsx';
import RanksPanel from './components/RanksPanel.jsx';
import FamiliesPanel from './components/FamiliesPanel.jsx';
import QuirksPanel from './components/QuirksPanel.jsx';

const TAB_IDS = new Set(TABS.map((t) => t.id));

// Same localStorage keys and formats as the original page, so saved settings carry over.
const parseFam = (v) => (c.familyById[v] ? v : 'cat');
const parseFac = (v) => (v === 'E' || v === 'K' ? v : 'E');
const parseZep = (v) => v !== '0';
const saveZep = (v) => (v ? '1' : '0');
const parseLvl = (v) => parseInt(v, 10) || 0;
// The URL hash (e.g. #planB) wins over the last tab viewed.
const parseTab = (v) => {
  const hash = window.location.hash.slice(1);
  if (TAB_IDS.has(hash)) return hash;
  return TAB_IDS.has(v) ? v : 'rules';
};

export default function App() {
  const [fam, setFam] = useStored('hpg-fam', parseFam);
  const [fac, setFac] = useStored('hpg-fac', parseFac);
  const [zep, setZep] = useStored('hpg-zep', parseZep, saveZep);
  const [lvl, setLvl] = useStored('hpg-lvl', parseLvl);
  const [tab, setTab] = useStored('hpg-tab', parseTab);
  const [query, setQuery] = useState('');

  const settings = useMemo(() => ({ fam, fac, zep }), [fam, fac, zep]);
  const family = c.familyById[fam];

  useEffect(() => {
    document.title = `${family.name} Pet Training Guide`;
  }, [family]);

  const pickFamily = (id) => {
    setFam(id);
    setTab('rules');
  };

  const planKey = `${fam}-${fac}-${zep}`;
  let panel;
  switch (tab) {
    case 'planA':
      panel = (
        <PlanPanel
          key={planKey}
          plan="planA"
          title="Plan A: every trip"
          sub="Learn each skill as soon as its source and the pet level line up. Only the highest rank in each trip is shown, since skipping ranks is free."
          stops={buildPlanA(c, settings)}
          settings={settings}
        />
      );
      break;
    case 'planB':
      panel = (
        <PlanPanel
          key={planKey}
          plan="planB"
          title="Plan B: one trip every 10 levels"
          sub="Teach the highest rank the pet's level allows at each visit, using pets you can tame by then."
          stops={buildPlanB(c, settings)}
          settings={settings}
        />
      );
      break;
    case 'speed':
      panel = <SpeedPanel settings={settings} lvl={lvl} setLvl={setLvl} />;
      break;
    case 'ranks':
      panel = <RanksPanel settings={settings} query={query} setQuery={setQuery} />;
      break;
    case 'fams':
      panel = <FamiliesPanel fam={fam} onPick={pickFamily} />;
      break;
    case 'more':
      panel = <QuirksPanel fam={fam} />;
      break;
    default:
      panel = <OverviewPanel settings={settings} />;
  }

  return (
    <div className="wrap">
      <Header fam={fam} />
      <Controls settings={settings} setFam={setFam} setFac={setFac} setZep={setZep} />
      <Tabs tab={tab} setTab={setTab} />
      <section className="panel on" id={tab}>
        {panel}
      </section>
    </div>
  );
}
