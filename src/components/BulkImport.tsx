import { useState } from 'react';
import type { AppData, Ingredient, PurchaseUnit, Recipe } from '../types';
import { PLANS } from '../plans';
import { uid } from '../store';

type Kind = 'recipes' | 'ingredients';

const HELP: Record<Kind, { format: string; example: string }> = {
  recipes: {
    format: 'Nombre ; Precio de venta ; Ventas al mes ; Categoría ; Porciones',
    example: 'Tacos al pastor (3) ; 8,50 ; 350 ; Tacos\nSopa de tortilla ; 6 ; 120 ; Entradas\nPozole grande ; 11 ; 90 ; Fuertes ; 1',
  },
  ingredients: {
    format: 'Nombre ; Unidad (kg, l, unidad) ; Cantidad de compra ; Precio ; Rendimiento %',
    example: 'Lomo de cerdo ; kg ; 1 ; 7,80 ; 90\nPiña ; unidad ; 1 ; 2,50 ; 55\nLeche entera ; l ; 1 ; 1,20 ; 100',
  },
};

/** Acepta "1.234,50", "1,234.50", "$12" y "12 %" */
export function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let s = raw.replace(/[^\d.,-]/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseUnit(raw: string | undefined): PurchaseUnit {
  const u = (raw ?? '').trim().toLowerCase();
  if (u.startsWith('l')) return 'l';
  if (u.startsWith('u') || u.startsWith('pz') || u.startsWith('pieza')) return 'unidad';
  return 'kg';
}

// Tabulador (copiado de Excel), punto y coma o barra; la coma se reserva para decimales
const splitRow = (line: string) => line.split(/\t|;|\|/).map((c) => c.trim());

export function BulkImport({ kind, data, setData }: { kind: Kind; data: AppData; setData: (fn: (d: AppData) => AppData) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const run = () => {
    const rows = text.split(/\r?\n/).map(splitRow).filter((r) => r[0]);
    if (!rows.length) return;
    let added = 0, updated = 0, skipped = 0;

    // Se calcula fuera del updater para que los contadores no se dupliquen en StrictMode
    const apply = (d: AppData): AppData => {
      if (kind === 'ingredients') {
        const list = [...d.ingredients];
        for (const r of rows) {
          const patch: Omit<Ingredient, 'id'> = {
            name: r[0],
            unit: parseUnit(r[1]),
            purchaseQty: parseNumber(r[2]) || 1,
            purchasePrice: parseNumber(r[3]),
            yieldPct: Math.min(100, parseNumber(r[4]) || 100),
          };
          const i = list.findIndex((x) => x.name.toLowerCase() === r[0].toLowerCase());
          if (i >= 0) { list[i] = { ...list[i], ...patch }; updated++; } else { list.push({ id: uid(), ...patch }); added++; }
        }
        return { ...d, ingredients: list };
      }

      const limit = PLANS[d.settings.plan].maxRecipes;
      const list = [...d.recipes];
      for (const r of rows) {
        const patch: Partial<Recipe> = {
          name: r[0],
          salePrice: parseNumber(r[1]),
          monthlySales: Math.round(parseNumber(r[2])),
          ...(r[3] ? { category: r[3] } : {}),
          ...(r[4] ? { portions: parseNumber(r[4]) || 1 } : {}),
        };
        const i = list.findIndex((x) => x.name.toLowerCase() === r[0].toLowerCase());
        if (i >= 0) { list[i] = { ...list[i], ...patch }; updated++; continue; }
        if (list.length >= limit) { skipped++; continue; }
        list.push({ id: uid(), category: 'General', portions: 1, salePrice: 0, monthlySales: 0, lines: [], ...patch } as Recipe);
        added++;
      }
      return { ...d, recipes: list };
    };
    const next = apply(data);
    setData(() => next);

    setResult(
      `${added} nuevos, ${updated} actualizados` +
        (skipped ? ` · ${skipped} omitidos por el límite del plan ${PLANS[data.settings.plan].name}` : ''),
    );
    setText('');
  };

  if (!open) {
    return (
      <div className="bulk-toggle">
        <button onClick={() => { setOpen(true); setResult(''); }}>📋 Pegar lista desde Excel</button>
      </div>
    );
  }

  return (
    <div className="card bulk">
      <div className="section-head">
        <div>
          <h3>Pegar {kind === 'recipes' ? 'platos' : 'ingredientes'}</h3>
          <p className="muted small">Una fila por línea. Puedes copiar columnas directo desde Excel o Google Sheets.</p>
          <p className="small"><code>{HELP[kind].format}</code></p>
        </div>
        <button className="ghost" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
      </div>
      <textarea rows={6} value={text} placeholder={HELP[kind].example} onChange={(e) => setText(e.target.value)} />
      <div className="row-actions">
        <span className="muted small">{result || 'Si el nombre ya existe, se actualiza en lugar de duplicarse.'}</span>
        <button className="primary" disabled={!text.trim()} onClick={run}>Importar</button>
      </div>
    </div>
  );
}
