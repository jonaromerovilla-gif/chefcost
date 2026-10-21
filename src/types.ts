export type PurchaseUnit = 'kg' | 'l' | 'unidad';

export interface Ingredient {
  id: string;
  name: string;
  unit: PurchaseUnit;
  /** Precio pagado por el paquete de compra */
  purchasePrice: number;
  /** Cantidad del paquete de compra, en `unit` */
  purchaseQty: number;
  /** Rendimiento útil en % (100 - merma) */
  yieldPct: number;
}

export interface RecipeLine {
  ingredientId: string;
  /** Cantidad en g, ml o unidades según el ingrediente */
  qty: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  portions: number;
  /** Precio de venta por porción */
  salePrice: number;
  /** Porciones vendidas al mes */
  monthlySales: number;
  lines: RecipeLine[];
}

export type PlanId = 'pequeno' | 'mediano' | 'grande';

export interface Settings {
  businessName: string;
  currency: string;
  /** Food cost objetivo en % */
  targetFoodCost: number;
  plan: PlanId;
}

export interface AppData {
  settings: Settings;
  ingredients: Ingredient[];
  recipes: Recipe[];
}

/** Un restaurante auditado */
export interface Client extends AppData {
  id: string;
}

/** Quien hace la auditoría; aparece en el informe */
export interface Consultant {
  name: string;
  phone: string;
  email: string;
}

export interface Workspace {
  activeId: string;
  clients: Client[];
  consultant: Consultant;
}

export type MenuClass = 'estrella' | 'caballo' | 'puzzle' | 'perro';
