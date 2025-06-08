export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  currentPrice: number;
  inStock: number;
  unitPrice: number;
  lastDeliveryDate: string | null;
  createdAt: string;
} 