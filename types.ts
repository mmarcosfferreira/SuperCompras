export enum Unit {
  UN = 'un',
  KG = 'kg',
  G = 'g',
  L = 'L',
  ML = 'ml',
  PCT = 'pct',
  CX = 'cx',
}

export const CATEGORIES = [
  "Hortifruti",
  "Açougue & Peixaria",
  "Laticínios & Frios",
  "Padaria",
  "Mercearia",
  "Bebidas",
  "Limpeza",
  "Higiene Pessoal",
  "Congelados",
  "Pet Shop",
  "Outros"
] as const;

export type CategoryType = typeof CATEGORIES[number];

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: CategoryType;
  price?: number;
  checked: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: number;
}

export enum ViewState {
  LISTS = 'LISTS',
  CURRENT_LIST = 'CURRENT_LIST',
  CALCULATOR = 'CALCULATOR',
}
