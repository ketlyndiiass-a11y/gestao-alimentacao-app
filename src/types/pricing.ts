export type IngredientUnit = "kg" | "g" | "l" | "ml" | "unidade" | "pacote";

export type Ingredient = {
  id: string;
  name: string;
  purchaseUnit: IngredientUnit;
  purchaseQuantity: number;
  purchasePrice: number;
  usedUnit: IngredientUnit;
  usedQuantity: number;
};

export type PricedProduct = {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
  packagingCost: number;
  extraCosts: number;
  monthlyFixedCosts: number;
  expectedMonthlySales: number;
  marginPercent: number;
  ifoodFeePercent: number;
  createdAt: string;
};

export type PricedProductInput = Omit<PricedProduct, "id" | "createdAt">;
