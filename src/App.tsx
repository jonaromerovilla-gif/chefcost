import { useState } from 'react';
import { emptyClient, useWorkspace } from './store';
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

const NEW_CLIENT = '__new__';

export default function App() {
  const { workspace, setWorkspace, data, setData } = useWorkspace();
  const [tab, setTab] = useState<Tab>('dashboard');

  const switchClient = (id: string) => {
    if (id !== NEW_CLIENT) {
      setWorkspace((w) => ({ ...w, activeId: id }));
      return;
    }
    const name = prompt('Nombre del restaurante:')?.trim();
    if (!name) return;
    const client = emptyClient(name, data);
    setWorkspace((w) => ({ ...w, activeId: client.id, clients: [...w.clients, client] }));
    setTab('recipes');
  };

  return (
    <div className="app">
      <nav className="topbar no-print">
        <div className="brand">
          <span className="logo">🔪</span>
          <strong>ChefCost</strong>
          <span className="badge">{PLANS[data.settings.plan].name}</span>
          <select className="client-switch" value={data.id} onChange={(e) => switchClient(e.target.value)} aria-label="Restaurante">
            {workspace.clients.map((c) => <option key={c.id} value={c.id}>{c.settings.businessName}</option>)}
            <option value={NEW_CLIENT}>+ Nuevo restaurante…</option>
          </select>
        </div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </nav>
      {/* key: al cambiar de restaurante se reinicia el estado local de cada pantalla */}
      <main key={data.id}>
        {tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'recipes' && <Recipes data={data} setData={setData} />}
        {tab === 'ingredients' && <Ingredients data={data} setData={setData} />}
        {tab === 'matrix' && <Matrix data={data} />}
        {tab === 'report' && <Report data={data} consultant={workspace.consultant} />}
        {tab === 'settings' && <Settings workspace={workspace} setWorkspace={setWorkspace} data={data} setData={setData} />}
      </main>
    </div>
  );
}
