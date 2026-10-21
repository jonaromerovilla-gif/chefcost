import { useState } from 'react';
import { useAppData } from './store';
import { PLANS } from './plans';
import { Dashboard } from './components/Dashboard';
import { Ingredients } from './components/Ingredients';
import { Recipes } from './components/Recipes';
import { Matrix } from './components/Matrix';
import { Report } from './components/Report';
import { Settings } from './components/Settings';

const TABS = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'recipes', label: 'Recetas' },
  { id: 'ingredients', label: 'Ingredientes' },
  { id: 'matrix', label: 'Matriz' },
  { id: 'report', label: 'Informe' },
  { id: 'settings', label: 'Ajustes' },
] as const;

type Tab = (typeof TABS)[number]['id'];

export default function App() {
  const [data, setData] = useAppData();
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="app">
      <nav className="topbar no-print">
        <div className="brand">
          <span className="logo">🔪</span>
          <strong>ChefCost</strong>
          <span className="badge">{PLANS[data.settings.plan].name}</span>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      <main>
        {tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'recipes' && <Recipes data={data} setData={setData} />}
        {tab === 'ingredients' && <Ingredients data={data} setData={setData} />}
        {tab === 'matrix' && <Matrix data={data} />}
        {tab === 'report' && <Report data={data} />}
        {tab === 'settings' && <Settings data={data} setData={setData} />}
      </main>
    </div>
  );
}
