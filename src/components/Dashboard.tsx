import type { AppData } from '../types';
import { analyzeMenu, CLASS_INFO, money } from '../calc';
import { FoodCostTag, Kpi } from './ui';

export function Dashboard({ data }: { data: AppData }) {
  const { currency, targetFoodCost } = data.settings;
  const a = analyzeMenu(data);
  const leaks = [...a.stats].filter((s) => s.monthlyLeak > 0).sort((x, y) => y.monthlyLeak - x.monthlyLeak);

  return (
    <section>
      <header className="section-head">
        <div>
          <h2>Resumen</h2>
          <p className="muted">Así está la rentabilidad de tu carta este mes.</p>
        </div>
      </header>

      {a.stats.some((s) => !s.recipe.lines.length) && (
        <p className="notice">
          Hay platos sin escandallo: su costo cuenta como 0. Completa sus ingredientes en Recetas para que los números sean reales.
        </p>
      )}

      <div className="kpis">
        <Kpi label="Ventas al mes" value={money(a.totalRevenue, currency)} />
        <Kpi label="Costo de alimentos" value={money(a.totalCost, currency)} />
        <Kpi
          label="Food cost promedio"
          value={`${a.avgFoodCostPct.toFixed(1)} %`}
          tone={a.avgFoodCostPct <= targetFoodCost ? 'good' : 'bad'}
          hint={`Objetivo ${targetFoodCost} %`}
        />
        <Kpi
          label="Dinero que se escapa"
          value={money(a.totalLeak, currency)}
          tone={a.totalLeak > 0 ? 'bad' : 'good'}
          hint="al mes, por platos sobre el objetivo"
        />
      </div>

      <div className="card">
        <h3>Platos que te están costando dinero</h3>
        {leaks.length === 0 ? (
          <p className="muted">Todos los platos están dentro del food cost objetivo. 👌</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Plato</th><th>Food cost</th><th>Precio actual</th><th>Precio sugerido</th><th>Pérdida al mes</th><th>Tipo</th></tr>
              </thead>
              <tbody>
                {leaks.map((s) => (
                  <tr key={s.recipe.id}>
                    <td>{s.recipe.name}</td>
                    <td><FoodCostTag value={s.foodCostPct} target={targetFoodCost} /></td>
                    <td className="mono">{money(s.recipe.salePrice, currency)}</td>
                    <td className="mono">{money(s.suggestedPrice, currency)}</td>
                    <td className="mono bad-text">{money(s.monthlyLeak, currency)}</td>
                    <td><span className="tag" style={{ color: CLASS_INFO[s.menuClass].color }}>{CLASS_INFO[s.menuClass].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
