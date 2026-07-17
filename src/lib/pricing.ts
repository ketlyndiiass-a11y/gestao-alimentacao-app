import type { Ingredient, PricedProduct } from "@/types/pricing";

function normalizeQuantity(unit: Ingredient["purchaseUnit"], quantity: number) {
  if (unit === "kg" || unit === "l") {
    return quantity * 1000;
  }

  return quantity;
}

export function calculateIngredientCost(ingredient: Ingredient) {
  const purchaseBaseQuantity = normalizeQuantity(
    ingredient.purchaseUnit,
    ingredient.purchaseQuantity
  );
  const usedBaseQuantity = normalizeQuantity(
    ingredient.usedUnit ?? ingredient.purchaseUnit,
    ingredient.usedQuantity
  );

  if (!purchaseBaseQuantity || !ingredient.purchasePrice || !usedBaseQuantity) {
    return 0;
  }

  const unitCost = ingredient.purchasePrice / purchaseBaseQuantity;
  return unitCost * usedBaseQuantity;
}

export function calculateProductPricing(product: PricedProduct) {
  const ingredientsCost = product.ingredients.reduce(
    (sum, ingredient) => sum + calculateIngredientCost(ingredient),
    0
  );
  const fixedCostPerUnit =
    product.monthlyFixedCosts > 0 && product.expectedMonthlySales > 0
      ? product.monthlyFixedCosts / product.expectedMonthlySales
      : 0;
  const packagingCost = product.packagingCost ?? 0;
  const directCost = ingredientsCost + packagingCost + product.extraCosts;
  const totalCost = directCost + fixedCostPerUnit;
  const counterPrice = totalCost * (1 + product.marginPercent / 100);
  const ifoodRate = product.ifoodFeePercent / 100;
  const ifoodPrice = ifoodRate >= 1 ? counterPrice : counterPrice / (1 - ifoodRate);
  const counterProfit = counterPrice - totalCost;
  const ifoodProfit = ifoodPrice - ifoodPrice * ifoodRate - totalCost;

  return {
    ingredientsCost,
    packagingCost,
    directCost,
    fixedCostPerUnit,
    totalCost,
    counterPrice,
    ifoodPrice,
    counterProfit,
    ifoodProfit
  };
}
