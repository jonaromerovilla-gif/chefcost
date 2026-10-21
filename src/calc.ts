import type { AppData, Ingredient, MenuClass, PurchaseUnit, Recipe } from './types';

export const RECIPE_UNIT: Record<PurchaseUnit, string> = { kg: 'g', l: 'ml', unidad: 'ud' };
const UNIT_FACTOR: Record<PurchaseUnit, number> = { kg: 1000, l: 1000, unidad: 1 };

/** Costo de una unidad de receta (g, ml o ud) ya aplicando la merma */
export function costPerRecipeUnit(ing: Ingredient, priceMultiplier = 1): number {
  const usable = ing.purchaseQty * UNIT_FACTOR[ing.unit] * (ing.yieldPct / 100);
  if (usable <= 0) return 0;
  return (ing.purchasePrice * priceMultiplier) / usable;
}

export interface RecipeStats {
  recipe: Recipe;
  batchCost: number;
  portionCost: number;
  foodCostPct: number;
  margin: number;
  monthlyRevenue: number;
  monthlyMargin: number;
  /** Precio que alcanza el food cost objetivo */
  suggestedPrice: number;
  /** Dinero mensual perdido frente al food cost objetivo */
  monthlyLeak: number;
  salesMixPct: number;
  menuClass: MenuClass;
}

export interface MenuAnalysis {
  stats: RecipeStats[];
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  avgFoodCostPct: number;
  totalLeak: number;
  popularityThreshold: number;
  marginThreshold: number;
}

export function analyzeMenu(data: AppData, priceMultipliers: Record<string, number> = {}): MenuAnalysis {
  const target = data.settings.targetFoodCost / 100;
  const byId = new Map(data.ingredients.map((i) => [i.id, i]));
  const totalSales = data.recipes.reduce((s, r) => s + r.monthlySales, 0);

  const base = data.recipes.map((recipe) => {
    const batchCost = recipe.lines.reduce((sum, line) => {
      const ing = byId.get(line.ingredientId);
      return ing ? sum + line.qty * costPerRecipeUnit(ing, priceMultipliers[ing.id] ?? 1) : sum;
    }, 0);
    const portionCost = recipe.portions > 0 ? batchCost / recipe.portions : 0;
    const margin = recipe.salePrice - portionCost;
    return {
      recipe,
      batchCost,
      portionCost,
      foodCostPct: recipe.salePrice > 0 ? (portionCost / recipe.salePrice) * 100 : 0,
      margin,
      monthlyRevenue: recipe.salePrice * recipe.monthlySales,
      monthlyMargin: margin * recipe.monthlySales,
      suggestedPrice: target > 0 ? portionCost / target : 0,
      monthlyLeak: Math.max(0, portionCost - target * recipe.salePrice) * recipe.monthlySales,
      salesMixPct: totalSales > 0 ? (recipe.monthlySales / totalSales) * 100 : 0,
    };
  });

  // Ingeniería de menú (Kasavana & Smith): popularidad al 70% de la media,
  // margen contra el margen medio ponderado por ventas.
  const n = base.length || 1;
  const popularityThreshold = (100 / n) * 0.7;
  const totalMargin = base.reduce((s, b) => s + b.monthlyMargin, 0);
  const marginThreshold = totalSales > 0 ? totalMargin / totalSales : 0;

  const stats: RecipeStats[] = base.map((b) => {
    const popular = b.salesMixPct >= popularityThreshold;
    const profitable = b.margin >= marginThreshold;
    const menuClass: MenuClass = popular
      ? profitable ? 'estrella' : 'caballo'
      : profitable ? 'puzzle' : 'perro';
    return { ...b, menuClass };
  });

  const totalRevenue = stats.reduce((s, b) => s + b.monthlyRevenue, 0);
  const totalCost = stats.reduce((s, b) => s + b.portionCost * b.recipe.monthlySales, 0);

  return {
    stats,
    totalRevenue,
    totalCost,
    totalMargin,
    avgFoodCostPct: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
    totalLeak: stats.reduce((s, b) => s + b.monthlyLeak, 0),
    popularityThreshold,
    marginThreshold,
  };
}

export const CLASS_INFO: Record<MenuClass, { label: string; color: string; advice: string }> = {
  estrella: {
    label: 'Estrella',
    color: '#16a34a',
    advice: 'Popular y rentable. Mantén la calidad y la porción, dale el lugar más visible de la carta.',
  },
  caballo: {
    label: 'Caballo',
    color: '#2563eb',
    advice: 'Se vende mucho pero deja poco. Sube un poco el precio, ajusta la porción o cambia algún ingrediente caro.',
  },
  puzzle: {
    label: 'Puzzle',
    color: '#d97706',
    advice: 'Deja buen margen pero se vende poco. Muévelo a una zona destacada, mejora la descripción o que el equipo lo recomiende.',
  },
  perro: {
    label: 'Perro',
    color: '#dc2626',
    advice: 'Poco popular y poco rentable. Rediséñalo por completo o sácalo de la carta.',
  },
};

export function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function pct(value: number): string {
  return `${value.toFixed(1)} %`;
}
