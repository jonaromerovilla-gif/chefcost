import type { AppData, MenuClass } from '../types';
import { analyzeMenu, CLASS_INFO, money } from '../calc';
import { hasFeature } from '../plans';
import { MatrixChart } from './Matrix';

export function Report({ data }: { data: AppData }) {
  const { currency, targetFoodCost, businessName, plan } = data.settings;
  const a = analyzeMenu(data);
  const branded = hasFeature(plan, 'brandedReport');
  const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  const sorted = [...a.stats].sort((x, y) => y.monthlyLeak - x.monthlyLeak);
  const order: MenuClass[] = ['perro', 'caballo', 'puzzle', 'estrella'];

  return (
    <section>
      <header className="section-head no-print">
        <div>
          <h2>Informe de rentabilidad</h2>
          <p className="muted">Listo para entregar al dueño del restaurante. Usa «Guardar como PDF» al imprimir.</p>
        </div>
        <button className="primary" onClick={() => window.print()}>Descargar PDF</button>
      </header>

      <article className="report card">
        <div className="report-head">
          <div>
            <p className="eyebrow">Auditoría de rentabilidad del menú</p>
            <h1>{businessName}</h1>
            <p className="muted">{date}</p>
          </div>
          {!branded && <p className="muted small">Generado con ChefCost</p>}
        </div>

        <div className="report-summary">
          <div><span>Ventas mensuales</span><strong>{money(a.totalRevenue, currency)}</strong></div>
          <div><span>Food cost promedio</span><strong>{a.avgFoodCostPct.toFixed(1)} %</strong><small>objetivo {targetFoodCost} %</small></div>
          <div><span>Margen bruto mensual</span><strong>{money(a.totalMargin, currency)}</strong></div>
          <div className="highlight"><span>Pérdida recuperable</span><strong>{money(a.totalLeak, currency)}/mes</strong><small>{money(a.totalLeak * 12, currency)} al año</small></div>
        </div>

        <h2>Matriz de ingeniería de menú</h2>
        <MatrixChart a={a} currency={currency} />

        <h2>Detalle por plato</h2>
        <table>
          <thead>
            <tr><th>Plato</th><th>Costo</th><th>Precio</th><th>Food cost</th><th>Sugerido</th><th>Pérdida/mes</th><th>Tipo</th></tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.recipe.id}>
                <td>{s.recipe.name}</td>
                <td className="mono">{money(s.portionCost, currency)}</td>
                <td className="mono">{money(s.recipe.salePrice, currency)}</td>
                <td className={s.foodCostPct > targetFoodCost ? 'bad-text' : ''}>{s.foodCostPct.toFixed(1)} %</td>
                <td className="mono">{s.foodCostPct > targetFoodCost ? money(s.suggestedPrice, currency) : '—'}</td>
                <td className="mono">{s.monthlyLeak > 0 ? money(s.monthlyLeak, currency) : '—'}</td>
                <td style={{ color: CLASS_INFO[s.menuClass].color }}>{CLASS_INFO[s.menuClass].label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Recomendaciones</h2>
        {order.map((c) => {
          const items = a.stats.filter((s) => s.menuClass === c);
          if (!items.length) return null;
          return (
            <div key={c} className="rec">
              <h3 style={{ color: CLASS_INFO[c].color }}>{CLASS_INFO[c].label}: {items.map((s) => s.recipe.name).join(', ')}</h3>
              <p>{CLASS_INFO[c].advice}</p>
            </div>
          );
        })}
      </article>
    </section>
  );
}
