import { useEffect, useMemo, useState } from 'react';
import { catalog as c } from './catalog.js';
import { buildPlan } from './lib/plans.js';
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
// The old Plan A / Plan B tabs were merged into one plan; old links and saved tabs land on it.
const OLD_TABS = { planA: 'plan', planB: 'plan' };
const tabId = (v) => OLD_TABS[v] ?? v;
// The URL hash (e.g. #ranks) wins over the last tab viewed.
const parseTab = (v) => {
  const hash = tabId(window.location.hash.slice(1));
  if (TAB_IDS.has(hash)) return hash;
  return TAB_IDS.has(tabId(v)) ? tabId(v) : 'rules';
};

export default function App() {
  const [fam, setFam] = useStored('hpg-fam', parseFam);
  const [fac, setFac] = useStored('hpg-fac', parseFac);
  const [zep, setZep] = useStored('hpg-zep', parseZep, saveZep);
  const [lvl, setLvl] = useStored('hpg-lvl', parseLvl);
  const [hideHigh, setHideHigh] = useStored('hpg-hidehigh', parseZep, saveZep);
  const [tab, setTab] = useStored('hpg-tab', parseTab);
  const [query, setQuery] = useState('');

  // 0 means no level limit: either no level entered or the toggle is off.
  const maxLvl = hideHigh && lvl ? lvl : 0;
  const settings = useMemo(() => ({ fam, fac, zep, maxLvl }), [fam, fac, zep, maxLvl]);
  const family = c.familyById[fam];

  useEffect(() => {
    document.title = `${family.name} Pet Training Guide`;
  }, [family]);

  const pickFamily = (id) => {
    setFam(id);
    setTab('rules');
  };

  const planKey = `${fam}-${fac}-${zep}-${maxLvl}`;
  let panel;
  switch (tab) {
    case 'plan':
      panel = (
        <PlanPanel
          key={planKey}
          // Ticks are still saved under the old Plan A key, so they carry over.
          plan="planA"
          title="Training plan"
          sub="One leg per 10 levels. Each skill shows in the leg where you can first learn it, at the highest rank that leg reaches, since skipping ranks is free."
          stops={buildPlan(c, settings)}
          settings={settings}
        />
      );
      break;
    case 'speed':
      panel = <SpeedPanel settings={settings} />;
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
      <Controls
        settings={settings}
        setFam={setFam}
        setFac={setFac}
        setZep={setZep}
        lvl={lvl}
        setLvl={setLvl}
        hideHigh={hideHigh}
        setHideHigh={setHideHigh}
      />
      <Tabs tab={tab} setTab={setTab} />
      <section className="panel on" id={tab}>
        {panel}
      </section>
    </div>
  );
}
