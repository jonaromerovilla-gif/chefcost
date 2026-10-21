import type { ChangeEvent } from 'react';
import type { AppData, Client, Consultant, PlanId, Settings as SettingsT, Workspace } from '../types';
import { money } from '../calc';
import { PLANS } from '../plans';
import { demoData } from '../store';
import { NumField } from './ui';

const CURRENCIES = ['USD', 'MXN', 'EUR', 'COP', 'ARS', 'CLP', 'PEN', 'GTQ', 'DOP'];

const PLAN_FEATURES: Record<PlanId, string[]> = {
  pequeno: ['1 local, 1 usuario', 'Hasta 50 recetas', 'Escandallos y food cost', 'Matriz de ingeniería de menú', 'Informe PDF básico'],
  mediano: ['Hasta 5 sucursales y 5 usuarios', 'Hasta 300 recetas', 'Simulador de precios', 'Informe con tu marca', 'Subrecetas · IA para facturas (próximamente)'],
  grande: ['Sucursales y usuarios ilimitados', 'Recetas ilimitadas', 'Todo lo del Mediano', 'Integración con POS (próximamente)', 'Soporte dedicado'],
};

export function Settings({ workspace, setWorkspace, data, setData }: {
  workspace: Workspace;
  setWorkspace: (fn: (w: Workspace) => Workspace) => void;
  data: Client;
  setData: (fn: (d: AppData) => AppData) => void;
}) {
  const s = data.settings;
  const set = (patch: Partial<SettingsT>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const setConsultant = (patch: Partial<Consultant>) =>
    setWorkspace((w) => ({ ...w, consultant: { ...w.consultant, ...patch } }));

  const deleteClient = () => {
    if (workspace.clients.length < 2) {
      alert('Debe quedar al menos un restaurante.');
      return;
    }
    if (!confirm(`¿Eliminar "${s.businessName}" y todas sus recetas? Exporta un respaldo antes si lo necesitas.`)) return;
    setWorkspace((w) => {
      const clients = w.clients.filter((c) => c.id !== data.id);
      return { ...w, clients, activeId: clients[0].id };
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chefcost-${s.businessName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (!parsed.settings || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.recipes)) throw new Error();
      setData(() => parsed);
    } catch {
      alert('El archivo no es un respaldo válido de ChefCost.');
    }
    e.target.value = '';
  };

  return (
    <section>
      <header className="section-head">
        <div><h2>Ajustes</h2><p className="muted">Datos del negocio, plan y respaldos.</p></div>
      </header>

      <div className="card grid-fields">
        <label className="wide">Nombre del negocio<input value={s.businessName} onChange={(e) => set({ businessName: e.target.value })} /></label>
        <label>Moneda
          <select value={s.currency} onChange={(e) => set({ currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Food cost objetivo (%)<NumField value={s.targetFoodCost} onChange={(v) => set({ targetFoodCost: v })} /></label>
      </div>

      <h3>Tu perfil de consultor</h3>
      <p className="muted small">Aparece en todos los informes que entregues. Se comparte entre todos tus restaurantes.</p>
      <div className="card grid-fields">
        <label>Nombre<input value={workspace.consultant.name} placeholder="Ej.: Chef Jonathan Romero" onChange={(e) => setConsultant({ name: e.target.value })} /></label>
        <label>Teléfono / WhatsApp<input value={workspace.consultant.phone} onChange={(e) => setConsultant({ phone: e.target.value })} /></label>
        <label>Email<input type="email" value={workspace.consultant.email} onChange={(e) => setConsultant({ email: e.target.value })} /></label>
      </div>

      <h3>Plan</h3>
      <div className="plans">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className={`card plan ${s.plan === p.id ? 'current' : ''}`}>
            <h3>{p.name}</h3>
            <p className="price">{money(p.monthly, 'USD')}<small>/mes</small></p>
            <p className="muted small">{money(p.yearly, 'USD')}/año · compra {p.id === 'grande' ? 'desde ' : ''}{money(p.lifetime, 'USD')}</p>
            <ul>{PLAN_FEATURES[p.id].map((f) => <li key={f}>{f}</li>)}</ul>
            <button className={s.plan === p.id ? '' : 'primary'} disabled={s.plan === p.id} onClick={() => set({ plan: p.id })}>
              {s.plan === p.id ? 'Plan actual' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
      <p className="muted small">Modo demo: el cambio de plan es inmediato. El cobro (Stripe / Mercado Pago) se conecta más adelante.</p>

      <h3>Respaldo</h3>
      <div className="row-actions">
        <button onClick={exportJson}>Exportar datos</button>
        <label className="button">Importar datos<input type="file" accept="application/json" hidden onChange={importJson} /></label>
        <button className="ghost danger" onClick={() => confirm('¿Reemplazar todo con los datos de demostración?') && setData(() => demoData())}>
          Restaurar demo
        </button>
        <button className="ghost danger" onClick={deleteClient}>Eliminar este restaurante</button>
      </div>
    </section>
  );
}
