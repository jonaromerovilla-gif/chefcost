import { useState } from 'react';
import type { AppData, Recipe } from '../types';
import { analyzeMenu, CLASS_INFO, costPerRecipeUnit, money, RECIPE_UNIT } from '../calc';
import { PLANS } from '../plans';
import { uid } from '../store';
import { FoodCostTag, Kpi, NumField } from './ui';

export function Recipes({ data, setData }: { data: AppData; setData: (fn: (d: AppData) => AppData) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(data.recipes[0]?.id ?? null);
  const { currency, targetFoodCost, plan } = data.settings;
  const limit = PLANS[plan].maxRecipes;
  const analysis = analyzeMenu(data);
  const selected = data.recipes.find((r) => r.id === selectedId);
  const stats = analysis.stats.find((s) => s.recipe.id === selectedId);
  const ingById = new Map(data.ingredients.map((i) => [i.id, i]));

  const update = (patch: Partial<Recipe>) =>
    setData((d) => ({ ...d, recipes: d.recipes.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)) }));

  const add = () => {
    if (data.recipes.length >= limit) {
      alert(`El plan ${PLANS[plan].name} permite hasta ${limit} recetas. Sube de plan en Ajustes.`);
      return;
    }
    const id = uid();
    setData((d) => ({
      ...d,
      recipes: [...d.recipes, { id, name: 'Nueva receta', category: 'General', portions: 1, salePrice: 0, monthlySales: 0, lines: [] }],
    }));
    setSelectedId(id);
  };

  const remove = () => {
    if (!selected || !confirm(`¿Eliminar "${selected.name}"?`)) return;
    setData((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== selected.id) }));
    setSelectedId(data.recipes.find((r) => r.id !== selected.id)?.id ?? null);
  };

  return (
    <section>
      <header className="section-head">
        <div>
          <h2>Recetas y escandallos</h2>
          <p className="muted">
            {data.recipes.length} de {Number.isFinite(limit) ? limit : '∞'} recetas en el plan {PLANS[plan].name}
          </p>
        </div>
        <button className="primary" onClick={add}>+ Receta</button>
      </header>

      <div className="split">
        <aside className="recipe-list">
          {analysis.stats.map((s) => (
            <button
              key={s.recipe.id}
              className={`recipe-item ${s.recipe.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(s.recipe.id)}
            >
              <span>
                <strong>{s.recipe.name}</strong>
                <small className="muted">{s.recipe.category}</small>
              </span>
              <FoodCostTag value={s.foodCostPct} target={targetFoodCost} />
            </button>
          ))}
        </aside>

        {selected && stats ? (
          <div className="card editor">
            <div className="grid-fields">
              <label className="wide">Nombre<input value={selected.name} onChange={(e) => update({ name: e.target.value })} /></label>
              <label>Categoría<input value={selected.category} onChange={(e) => update({ category: e.target.value })} /></label>
              <label>Porciones que rinde<NumField value={selected.portions} min={1} onChange={(v) => update({ portions: v })} /></label>
              <label>Precio de venta / porción<NumField value={selected.salePrice} onChange={(v) => update({ salePrice: v })} /></label>
              <label>Ventas al mes<NumField value={selected.monthlySales} step="1" onChange={(v) => update({ monthlySales: v })} /></label>
            </div>

            <div className="kpis">
              <Kpi label="Costo por porción" value={money(stats.portionCost, currency)} />
              <Kpi
                label="Food cost"
                value={`${stats.foodCostPct.toFixed(1)} %`}
                tone={stats.foodCostPct <= targetFoodCost ? 'good' : 'bad'}
                hint={`Objetivo ${targetFoodCost} %`}
              />
              <Kpi label="Margen por porción" value={money(stats.margin, currency)} />
              <Kpi
                label="Precio sugerido"
                value={money(stats.suggestedPrice, currency)}
                hint={`para ${targetFoodCost} % de food cost`}
              />
            </div>

            <p className="class-line">
              <span className="dot" style={{ background: CLASS_INFO[stats.menuClass].color }} />
              <strong>{CLASS_INFO[stats.menuClass].label}:</strong> {CLASS_INFO[stats.menuClass].advice}
            </p>

            <h3>Ingredientes de la receta</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Ingrediente</th><th>Cantidad</th><th>Costo</th><th>% del costo</th><th /></tr>
                </thead>
                <tbody>
                  {selected.lines.map((line, idx) => {
                    const ing = ingById.get(line.ingredientId);
                    const cost = ing ? line.qty * costPerRecipeUnit(ing) : 0;
                    const setLine = (patch: Partial<typeof line>) =>
                      update({ lines: selected.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) });
                    return (
                      <tr key={idx}>
                        <td>
                          <select value={line.ingredientId} onChange={(e) => setLine({ ingredientId: e.target.value })}>
                            {data.ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </td>
                        <td className="qty">
                          <NumField value={line.qty} onChange={(v) => setLine({ qty: v })} />
                          <span className="muted">{ing ? RECIPE_UNIT[ing.unit] : ''}</span>
                        </td>
                        <td className="mono">{money(cost, currency)}</td>
                        <td>
                          <div className="bar"><span style={{ width: `${stats.batchCost ? (cost / stats.batchCost) * 100 : 0}%` }} /></div>
                        </td>
                        <td>
                          <button className="ghost danger" aria-label="Quitar"
                            onClick={() => update({ lines: selected.lines.filter((_, i) => i !== idx) })}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr><td>Total de la receta</td><td /><td className="mono">{money(stats.batchCost, currency)}</td><td /><td /></tr>
                </tfoot>
              </table>
            </div>
            <div className="row-actions">
              <button
                disabled={!data.ingredients.length}
                onClick={() => update({ lines: [...selected.lines, { ingredientId: data.ingredients[0].id, qty: 0 }] })}
              >
                + Añadir ingrediente
              </button>
              <button className="ghost danger" onClick={remove}>Eliminar receta</button>
            </div>
          </div>
        ) : (
          <div className="card empty">Crea tu primera receta.</div>
        )}
      </div>
    </section>
  );
}
