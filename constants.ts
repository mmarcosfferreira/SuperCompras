import { Unit } from './types';
import { 
  Apple, 
  Beef, 
  Milk, 
  Croissant, 
  ShoppingBasket, 
  GlassWater, 
  SprayCan, 
  Sparkles, 
  Snowflake, 
  Dog, 
  Package,
  LucideIcon
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Hortifruti": Apple,
  "Açougue & Peixaria": Beef,
  "Laticínios & Frios": Milk,
  "Padaria": Croissant,
  "Mercearia": ShoppingBasket,
  "Bebidas": GlassWater,
  "Limpeza": SprayCan,
  "Higiene Pessoal": Sparkles,
  "Congelados": Snowflake,
  "Pet Shop": Dog,
  "Outros": Package,
};

export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.UN]: 'un',
  [Unit.KG]: 'kg',
  [Unit.G]: 'g',
  [Unit.L]: 'L',
  [Unit.ML]: 'ml',
  [Unit.PCT]: 'pct',
  [Unit.CX]: 'cx',
};
