import { useEffect, useState } from 'react';
import type { AppData, Client, Workspace } from './types';

const KEY = 'chefcost:workspace:v2';
const LEGACY_KEY = 'chefcost:data:v1';

export const uid = () => crypto.randomUUID();

export function demoData(): AppData {
  const ing = {
    res: uid(), pollo: uid(), tortilla: uid(), aguacate: uid(), cebolla: uid(),
    tomate: uid(), queso: uid(), crema: uid(), arroz: uid(), frijol: uid(), aceite: uid(), camaron: uid(),
  };
  return {
    settings: { businessName: 'Restaurante Demo', currency: 'USD', targetFoodCost: 30, plan: 'pequeno' },
    ingredients: [
      { id: ing.res, name: 'Arrachera de res', unit: 'kg', purchasePrice: 14, purchaseQty: 1, yieldPct: 85 },
      { id: ing.pollo, name: 'Pechuga de pollo', unit: 'kg', purchasePrice: 6.5, purchaseQty: 1, yieldPct: 92 },
      { id: ing.camaron, name: 'Camarón 21/25', unit: 'kg', purchasePrice: 18, purchaseQty: 1, yieldPct: 70 },
      { id: ing.tortilla, name: 'Tortilla de maíz', unit: 'kg', purchasePrice: 1.6, purchaseQty: 1, yieldPct: 100 },
      { id: ing.aguacate, name: 'Aguacate Hass', unit: 'kg', purchasePrice: 4.2, purchaseQty: 1, yieldPct: 65 },
      { id: ing.cebolla, name: 'Cebolla blanca', unit: 'kg', purchasePrice: 1.1, purchaseQty: 1, yieldPct: 88 },
      { id: ing.tomate, name: 'Tomate saladet', unit: 'kg', purchasePrice: 1.4, purchaseQty: 1, yieldPct: 90 },
      { id: ing.queso, name: 'Queso Oaxaca', unit: 'kg', purchasePrice: 8, purchaseQty: 1, yieldPct: 100 },
      { id: ing.crema, name: 'Crema ácida', unit: 'l', purchasePrice: 3.5, purchaseQty: 1, yieldPct: 100 },
      { id: ing.arroz, name: 'Arroz', unit: 'kg', purchasePrice: 1.3, purchaseQty: 1, yieldPct: 100 },
      { id: ing.frijol, name: 'Frijol negro', unit: 'kg', purchasePrice: 1.8, purchaseQty: 1, yieldPct: 100 },
      { id: ing.aceite, name: 'Aceite vegetal', unit: 'l', purchasePrice: 2.4, purchaseQty: 1, yieldPct: 100 },
    ],
    recipes: [
      {
        id: uid(), name: 'Tacos de arrachera (3)', category: 'Tacos', portions: 1, salePrice: 9.5, monthlySales: 420,
        lines: [
          { ingredientId: ing.res, qty: 150 }, { ingredientId: ing.tortilla, qty: 90 },
          { ingredientId: ing.cebolla, qty: 20 }, { ingredientId: ing.aguacate, qty: 40 },
        ],
      },
      {
        id: uid(), name: 'Tacos de pollo (3)', category: 'Tacos', portions: 1, salePrice: 7, monthlySales: 380,
        lines: [
          { ingredientId: ing.pollo, qty: 140 }, { ingredientId: ing.tortilla, qty: 90 },
          { ingredientId: ing.cebolla, qty: 20 }, { ingredientId: ing.tomate, qty: 40 },
        ],
      },
      {
        id: uid(), name: 'Guacamole con totopos', category: 'Entradas', portions: 4, salePrice: 6.5, monthlySales: 260,
        lines: [
          { ingredientId: ing.aguacate, qty: 800 }, { ingredientId: ing.tomate, qty: 200 },
          { ingredientId: ing.cebolla, qty: 100 }, { ingredientId: ing.tortilla, qty: 400 },
          { ingredientId: ing.aceite, qty: 150 },
        ],
      },
      {
        id: uid(), name: 'Quesadilla de queso', category: 'Entradas', portions: 1, salePrice: 5, monthlySales: 90,
        lines: [{ ingredientId: ing.queso, qty: 120 }, { ingredientId: ing.tortilla, qty: 60 }, { ingredientId: ing.crema, qty: 30 }],
      },
      {
        id: uid(), name: 'Camarones al ajillo', category: 'Fuertes', portions: 1, salePrice: 14, monthlySales: 70,
        lines: [
          { ingredientId: ing.camaron, qty: 220 }, { ingredientId: ing.arroz, qty: 90 },
          { ingredientId: ing.aceite, qty: 40 }, { ingredientId: ing.aguacate, qty: 50 },
        ],
      },
      {
        id: uid(), name: 'Plato de arroz y frijoles', category: 'Guarniciones', portions: 1, salePrice: 3.5, monthlySales: 60,
        lines: [{ ingredientId: ing.arroz, qty: 120 }, { ingredientId: ing.frijol, qty: 120 }, { ingredientId: ing.crema, qty: 20 }],
      },
    ],
  };
}

export function emptyClient(businessName: string, base?: AppData): Client {
  return {
    id: uid(),
    settings: { ...(base?.settings ?? demoData().settings), businessName },
    ingredients: [],
    recipes: [],
  };
}

function load(): Workspace {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Workspace;
    // Migración desde la versión con un solo restaurante
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const client = { id: uid(), ...(JSON.parse(legacy) as AppData) };
      return { activeId: client.id, clients: [client], consultant: { name: '', phone: '', email: '' } };
    }
  } catch {
    // datos corruptos o almacenamiento bloqueado: empezamos con la demo
  }
  const client = { id: uid(), ...demoData() };
  return { activeId: client.id, clients: [client], consultant: { name: '', phone: '', email: '' } };
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(workspace));
    } catch {
      // sin almacenamiento disponible, la app sigue funcionando en memoria
    }
  }, [workspace]);

  const data = workspace.clients.find((c) => c.id === workspace.activeId) ?? workspace.clients[0];
  const setData = (fn: (d: AppData) => AppData) =>
    setWorkspace((w) => ({
      ...w,
      clients: w.clients.map((c) => (c.id === data.id ? { ...fn(c), id: c.id } : c)),
    }));

  return { workspace, setWorkspace, data, setData };
}
