import type { AppData, Consultant } from '../types';
import { actionPlan, analyzeMenu, CLASS_INFO, money } from '../calc';
import { hasFeature, PLANS } from '../plans';
import { MatrixChart } from './Matrix';

export function Report({ data, consultant }: { data: AppData; consultant: Consultant }) {
  const { currency, targetFoodCost, businessName, plan } = data.settings;
  const a = analyzeMenu(data);
  const branded = hasFeature(plan, 'brandedReport');
  const date = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  const sorted = [...a.stats].sort((x, y) => y.monthlyLeak - x.monthlyLeak);
  const uncosted = a.stats.filter((s) => !s.recipe.lines.length);
  const actions = actionPlan(a, currency, targetFoodCost);
  const potential = actions.reduce((s, x) => s + x.monthlyGain, 0);
  const top = actions.filter((x) => x.monthlyGain > 0).slice(0, 3);
  const contact = [consultant.phone, consultant.email].filter(Boolean).join(' · ');

  return (
    <section>
      <header className="section-head no-print">
        <div>
          <h2>Informe de rentabilidad</h2>
          <p className="muted">Listo para entregar al dueño del restaurante. Usa «Guardar como PDF» al imprimir.</p>
        </div>
        <button className="primary" onClick={() => window.print()}>Descargar PDF</button>
      </header>

      {!consultant.name && (
        <p className="notice no-print">Añade tu nombre y contacto en Ajustes → Tu perfil de consultor para que aparezcan en el informe.</p>
      )}
      {uncosted.length > 0 && (
        <p className="notice no-print">
          {uncosted.length} plato(s) sin escandallo ({uncosted.map((s) => s.recipe.name).join(', ')}). Su costo cuenta como 0 y
          distorsiona el análisis: añade sus ingredientes en Recetas.
        </p>
      )}

      <article className="report card">
        <div className="report-head">
          <div>
            <p className="eyebrow">Auditoría de rentabilidad del menú</p>
            <h1>{businessName}</h1>
            <p className="muted">{date}</p>
          </div>
          <div className="report-author">
            {consultant.name && <strong>{consultant.name}</strong>}
            {contact && <span className="muted small">{contact}</span>}
            {!branded && <span className="muted small">Generado con ChefCost</span>}
          </div>
        </div>

        <div className="report-summary">
          <div><span>Ventas mensuales</span><strong>{money(a.totalRevenue, currency)}</strong></div>
          <div><span>Food cost promedio</span><strong>{a.avgFoodCostPct.toFixed(1)} %</strong><small>objetivo {targetFoodCost} %</small></div>
          <div><span>Margen bruto mensual</span><strong>{money(a.totalMargin, currency)}</strong></div>
          <div className="highlight"><span>Ganancia potencial</span><strong>+{money(potential, currency)}/mes</strong><small>{money(potential * 12, currency)} al año</small></div>
        </div>

        {top.length > 0 && (
          <div className="exec">
            <h2>Resumen ejecutivo</h2>
            <p>
              Aplicando las {top.length} acciones principales de este informe, {businessName} podría ganar alrededor de{' '}
              <strong>{money(top.reduce((s, x) => s + x.monthlyGain, 0), currency)} más al mes</strong> sin vender un plato más
              de lo que ya vende hoy{top.some((x) => x.title.startsWith('Destacar')) ? ' (salvo en los platos a destacar)' : ''}.
            </p>
          </div>
        )}

        <h2>Plan de acción</h2>
        {actions.length === 0 ? (
          <p className="muted">La carta está bien equilibrada: todos los platos están dentro del objetivo.</p>
        ) : (
          <ol className="actions">
            {actions.map((x) => (
              <li key={x.title}>
                <div>
                  <strong>{x.title}</strong>
                  <p className="muted small">{x.detail}</p>
                </div>
                <span className="gain">{x.monthlyGain > 0 ? `+${money(x.monthlyGain, currency)}/mes` : '—'}</span>
              </li>
            ))}
          </ol>
        )}

        <h2>Matriz de ingeniería de menú</h2>
        <MatrixChart a={a} currency={currency} />
        <div className="legend">
          {(['estrella', 'caballo', 'puzzle', 'perro'] as const).map((c) => (
            <p key={c} className="small"><strong style={{ color: CLASS_INFO[c].color }}>{CLASS_INFO[c].label}:</strong> {CLASS_INFO[c].advice}</p>
          ))}
        </div>

        <h2>Detalle por plato</h2>
        <table>
          <thead>
            <tr><th>Plato</th><th>Costo</th><th>Precio</th><th>Food cost</th><th>Ventas/mes</th><th>Pérdida/mes</th><th>Tipo</th></tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.recipe.id}>
                <td>{s.recipe.name}</td>
                <td className="mono">{s.recipe.lines.length ? money(s.portionCost, currency) : 'sin escandallo'}</td>
                <td className="mono">{money(s.recipe.salePrice, currency)}</td>
                <td className={s.foodCostPct > targetFoodCost ? 'bad-text' : ''}>{s.foodCostPct.toFixed(1)} %</td>
                <td className="mono">{s.recipe.monthlySales}</td>
                <td className="mono">{s.monthlyLeak > 0 ? money(s.monthlyLeak, currency) : '—'}</td>
                <td style={{ color: CLASS_INFO[s.menuClass].color }}>{CLASS_INFO[s.menuClass].label}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="report-cta">
          <h2>Próximo paso</h2>
          <p>
            Los precios de los proveedores cambian cada mes. Con el seguimiento mensual de ChefCost (desde{' '}
            {money(PLANS.pequeno.monthly, 'USD')}/mes) este análisis se mantiene actualizado y avisa cuando un plato deja de ser rentable.
          </p>
          {consultant.name && <p>Contacto: <strong>{consultant.name}</strong>{contact && ` · ${contact}`}</p>}
        </div>
        <p className="muted small method">
          Metodología: food cost = costo de ingredientes por porción ÷ precio de venta, incluyendo merma. Clasificación según
          Kasavana &amp; Smith: popularidad frente al 70 % de la participación media y margen frente al margen medio ponderado.
          Las ganancias son estimaciones con el volumen de ventas actual.
        </p>
      </article>
    </section>
  );
}
