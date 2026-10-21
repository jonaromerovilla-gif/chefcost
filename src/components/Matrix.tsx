import { useState } from 'react';
import type { AppData, MenuClass } from '../types';
import { analyzeMenu, CLASS_INFO, money, type MenuAnalysis } from '../calc';
import { hasFeature } from '../plans';
import { FoodCostTag, Locked } from './ui';

const W = 640, H = 380, P = 48;

export function MatrixChart({ a, currency }: { a: MenuAnalysis; currency: string }) {
  const maxX = Math.max(a.popularityThreshold * 2, ...a.stats.map((s) => s.salesMixPct)) * 1.1;
  const margins = a.stats.map((s) => s.margin);
  const minY = Math.min(0, ...margins);
  const maxY = Math.max(a.marginThreshold * 2, ...margins) * 1.1 || 1;
  const x = (v: number) => P + (v / maxX) * (W - P * 2);
  const y = (v: number) => H - P - ((v - minY) / (maxY - minY)) * (H - P * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="matrix" role="img" aria-label="Matriz de ingeniería de menú">
      <rect x={x(a.popularityThreshold)} y={P} width={W - P - x(a.popularityThreshold)} height={y(a.marginThreshold) - P} fill="#16a34a" opacity="0.06" />
      <rect x={P} y={P} width={x(a.popularityThreshold) - P} height={y(a.marginThreshold) - P} fill="#d97706" opacity="0.06" />
      <rect x={x(a.popularityThreshold)} y={y(a.marginThreshold)} width={W - P - x(a.popularityThreshold)} height={H - P - y(a.marginThreshold)} fill="#2563eb" opacity="0.06" />
      <rect x={P} y={y(a.marginThreshold)} width={x(a.popularityThreshold) - P} height={H - P - y(a.marginThreshold)} fill="#dc2626" opacity="0.06" />

      <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="axis" />
      <line x1={P} y1={P} x2={P} y2={H - P} className="axis" />
      <line x1={x(a.popularityThreshold)} y1={P} x2={x(a.popularityThreshold)} y2={H - P} className="threshold" />
      <line x1={P} y1={y(a.marginThreshold)} x2={W - P} y2={y(a.marginThreshold)} className="threshold" />

      <text x={W - P} y={P - 10} textAnchor="end" className="q-label" fill="#16a34a">ESTRELLAS</text>
      <text x={P + 4} y={P - 10} className="q-label" fill="#d97706">PUZZLES</text>
      <text x={W - P} y={H - 8} textAnchor="end" className="q-label" fill="#2563eb">CABALLOS</text>
      <text x={P + 4} y={H - 8} className="q-label" fill="#dc2626">PERROS</text>

      <text x={W / 2} y={H - 22} textAnchor="middle" className="axis-label">Popularidad (% de ventas) →</text>
      <text x={14} y={H / 2} textAnchor="middle" className="axis-label" transform={`rotate(-90 14 ${H / 2})`}>Margen por plato →</text>
      <text x={P - 6} y={y(a.marginThreshold) + 4} textAnchor="end" className="tick">{money(a.marginThreshold, currency)}</text>

      {a.stats.map((s) => (
        <g key={s.recipe.id}>
          <circle cx={x(s.salesMixPct)} cy={y(s.margin)} r={7} fill={CLASS_INFO[s.menuClass].color} />
          <text x={x(s.salesMixPct) + 10} y={y(s.margin) + 4} className="point-label">{s.recipe.name}</text>
        </g>
      ))}
    </svg>
  );
}

function Simulator({ data }: { data: AppData }) {
  const [ingId, setIngId] = useState(data.ingredients[0]?.id ?? '');
  const [change, setChange] = useState(20);
  const { currency, targetFoodCost } = data.settings;
  const before = analyzeMenu(data);
  const after = analyzeMenu(data, { [ingId]: 1 + change / 100 });
  const affected = after.stats
    .map((s, i) => ({ after: s, before: before.stats[i] }))
    .filter((r) => r.after.portionCost !== r.before.portionCost);

  return (
    <div className="card">
      <h3>Simulador de precios</h3>
      <div className="sim-controls">
        <label>Si el precio de
          <select value={ingId} onChange={(e) => setIngId(e.target.value)}>
            {data.ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label>cambia un <strong>{change > 0 ? '+' : ''}{change} %</strong>
          <input type="range" min={-50} max={100} step={5} value={change} onChange={(e) => setChange(Number(e.target.value))} />
        </label>
      </div>
      {affected.length === 0 ? (
        <p className="muted">Ningún plato usa este ingrediente.</p>
      ) : (
        <>
          <p>
            Tu margen mensual pasa de <strong>{money(before.totalMargin, currency)}</strong> a{' '}
            <strong className={after.totalMargin < before.totalMargin ? 'bad-text' : 'good-text'}>{money(after.totalMargin, currency)}</strong>.
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Plato</th><th>Food cost antes</th><th>Food cost después</th><th>Nuevo precio sugerido</th></tr></thead>
              <tbody>
                {affected.map(({ before: b, after: s }) => (
                  <tr key={s.recipe.id}>
                    <td>{s.recipe.name}</td>
                    <td><FoodCostTag value={b.foodCostPct} target={targetFoodCost} /></td>
                    <td><FoodCostTag value={s.foodCostPct} target={targetFoodCost} /></td>
                    <td className="mono">{money(s.suggestedPrice, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function Matrix({ data }: { data: AppData }) {
  const a = analyzeMenu(data);
  const { currency } = data.settings;
  const classes: MenuClass[] = ['estrella', 'caballo', 'puzzle', 'perro'];

  return (
    <section>
      <header className="section-head">
        <div>
          <h2>Ingeniería de menú</h2>
          <p className="muted">Cada plato según cuánto se vende y cuánto deja.</p>
        </div>
      </header>

      {a.stats.length < 2 ? (
        <div className="card empty">Necesitas al menos 2 recetas con ventas para ver la matriz.</div>
      ) : (
        <>
          <div className="card"><MatrixChart a={a} currency={currency} /></div>
          <div className="quadrants">
            {classes.map((c) => {
              const items = a.stats.filter((s) => s.menuClass === c);
              return (
                <div key={c} className="card quadrant" style={{ borderTopColor: CLASS_INFO[c].color }}>
                  <h3 style={{ color: CLASS_INFO[c].color }}>{CLASS_INFO[c].label} ({items.length})</h3>
                  <p className="muted small">{CLASS_INFO[c].advice}</p>
                  <ul>
                    {items.map((s) => (
                      <li key={s.recipe.id}>
                        {s.recipe.name}
                        <span className="muted"> · {money(s.margin, currency)} margen · {s.salesMixPct.toFixed(1)} % ventas</span>
                      </li>
                    ))}
                    {!items.length && <li className="muted">—</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}

      {hasFeature(data.settings.plan, 'simulator') ? (
        <Simulator data={data} />
      ) : (
        <Locked feature="simulator">Simula subidas de precio de tus proveedores y mira qué platos dejan de ser rentables.</Locked>
      )}
    </section>
  );
}
