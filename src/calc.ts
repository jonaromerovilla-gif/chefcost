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

/** Redondea hacia arriba a un precio "de carta" según la magnitud */
export function menuPrice(value: number): number {
  const step = value < 20 ? 0.5 : value < 200 ? 5 : 10;
  return Math.ceil(value / step) * step;
}

/** Subida máxima de precio recomendada de una sola vez */
const MAX_PRICE_RAISE = 0.15;

export interface Action {
  recipeName: string;
  title: string;
  detail: string;
  /** Ganancia mensual estimada; 0 si no es cuantificable */
  monthlyGain: number;
}

/** Plan de acción priorizado por impacto económico */
export function actionPlan(a: MenuAnalysis, currency: string, target: number): Action[] {
  const actions: Action[] = [];
  for (const s of a.stats) {
    if (!s.recipe.lines.length) continue;
    const name = s.recipe.name;
    if (s.foodCostPct > target) {
      const t = target / 100;
      const price = s.recipe.salePrice;
      // Una subida mayor al tope espanta clientes: el resto se cubre bajando el costo
      const cappedPrice = Math.min(menuPrice(s.suggestedPrice), menuPrice(price * (1 + MAX_PRICE_RAISE)));
      const newPrice = Math.max(price, cappedPrice);
      const targetCost = t * newPrice;
      const needsCostCut = s.portionCost > targetCost + 0.005;
      const raise = newPrice > price;
      // Margen al llegar al objetivo con el precio nuevo, menos el margen actual
      const gain = (newPrice - Math.min(s.portionCost, targetCost) - s.margin) * s.recipe.monthlySales;
      const costText = `bajar su costo por porción de ${money(s.portionCost, currency)} a ${money(targetCost, currency)} ajustando gramajes o ingredientes`;
      actions.push({
        recipeName: name,
        title: raise
          ? `Subir ${name} de ${money(price, currency)} a ${money(newPrice, currency)}${needsCostCut ? ' y ajustar su receta' : ''}`
          : `Ajustar la receta de ${name}`,
        detail: needsCostCut
          ? `${raise ? 'Además, ' : ''}${costText}, para llegar al ${target} % de food cost.`
          : `Con este precio queda en el ${target} % de food cost o por debajo.`,
        monthlyGain: gain,
      });
    } else if (s.menuClass === 'puzzle') {
      // Si se vendiera hasta el umbral de popularidad, con el mismo margen
      const totalSales = a.stats.reduce((t, x) => t + x.recipe.monthlySales, 0);
      const extraSales = Math.max(0, (a.popularityThreshold / 100) * totalSales - s.recipe.monthlySales);
      actions.push({
        recipeName: name,
        title: `Destacar ${name} en la carta`,
        detail: 'Buen margen pero pocas ventas: recuadro en la carta, mejor foto o descripción, y que los meseros lo recomienden.',
        monthlyGain: extraSales * s.margin,
      });
    } else if (s.menuClass === 'perro') {
      actions.push({
        recipeName: name,
        title: `Rediseñar o retirar ${name}`,
        detail: 'Se vende poco y deja poco margen. Libera espacio en la carta y en la cocina para platos más rentables.',
        monthlyGain: 0,
      });
    }
  }
  return actions.sort((x, y) => y.monthlyGain - x.monthlyGain);
}

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
