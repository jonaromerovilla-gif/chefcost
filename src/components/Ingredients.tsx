import type { AppData, Ingredient, PurchaseUnit } from '../types';
import { costPerRecipeUnit, money, RECIPE_UNIT } from '../calc';
import { uid } from '../store';
import { NumField } from './ui';
import { BulkImport } from './BulkImport';

export function Ingredients({ data, setData }: { data: AppData; setData: (fn: (d: AppData) => AppData) => void }) {
  const { currency } = data.settings;

  const update = (id: string, patch: Partial<Ingredient>) =>
    setData((d) => ({ ...d, ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const add = () =>
    setData((d) => ({
      ...d,
      ingredients: [...d.ingredients, { id: uid(), name: 'Nuevo ingrediente', unit: 'kg', purchasePrice: 0, purchaseQty: 1, yieldPct: 100 }],
    }));

  const remove = (id: string) => {
    const used = data.recipes.filter((r) => r.lines.some((l) => l.ingredientId === id));
    if (used.length && !confirm(`Se usa en ${used.length} receta(s): ${used.map((r) => r.name).join(', ')}. ¿Eliminar de todas formas?`)) return;
    setData((d) => ({
      ...d,
      ingredients: d.ingredients.filter((i) => i.id !== id),
      recipes: d.recipes.map((r) => ({ ...r, lines: r.lines.filter((l) => l.ingredientId !== id) })),
    }));
  };

  return (
    <section>
      <header className="section-head">
        <div>
          <h2>Ingredientes</h2>
          <p className="muted">Precio de compra y merma. El costo útil se calcula solo.</p>
        </div>
        <div className="row-actions">
          <button className="primary" onClick={add}>+ Ingrediente</button>
        </div>
      </header>
      <BulkImport kind="ingredients" data={data} setData={setData} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Unidad</th>
              <th>Cantidad compra</th>
              <th>Precio compra</th>
              <th>Rendimiento %</th>
              <th>Costo útil</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.ingredients.map((ing) => {
              const perUnit = costPerRecipeUnit(ing);
              const ru = RECIPE_UNIT[ing.unit];
              return (
                <tr key={ing.id}>
                  <td><input value={ing.name} onChange={(e) => update(ing.id, { name: e.target.value })} /></td>
                  <td>
                    <select value={ing.unit} onChange={(e) => update(ing.id, { unit: e.target.value as PurchaseUnit })}>
                      <option value="kg">kg</option>
                      <option value="l">litro</option>
                      <option value="unidad">unidad</option>
                    </select>
                  </td>
                  <td><NumField value={ing.purchaseQty} onChange={(v) => update(ing.id, { purchaseQty: v })} /></td>
                  <td><NumField value={ing.purchasePrice} onChange={(v) => update(ing.id, { purchasePrice: v })} /></td>
                  <td><NumField value={ing.yieldPct} onChange={(v) => update(ing.id, { yieldPct: Math.min(100, v) })} /></td>
                  <td className="mono">
                    {ru === 'ud' ? `${money(perUnit, currency)} / ud` : `${money(perUnit * 1000, currency)} / ${ing.unit} útil`}
                  </td>
                  <td><button className="ghost danger" onClick={() => remove(ing.id)} aria-label="Eliminar">✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Rendimiento = lo que queda después de limpiar, pelar o cocinar. Ej.: aguacate ≈ 65 %, camarón con cáscara ≈ 70 %.
      </p>
    </section>
  );
}
