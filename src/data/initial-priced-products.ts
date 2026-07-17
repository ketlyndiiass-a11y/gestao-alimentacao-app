import type { PricedProduct } from "@/types/pricing";

// Dados fictícios para validar a precificação antes da integração com Supabase.
export const initialPricedProducts: PricedProduct[] = [
  {
    id: "priced-1",
    name: "Marmita de frango",
    category: "Marmita",
    packagingCost: 2,
    extraCosts: 1.2,
    monthlyFixedCosts: 13000,
    expectedMonthlySales: 1200,
    marginPercent: 35,
    ifoodFeePercent: 20,
    createdAt: "2026-07-16",
    ingredients: [
      {
        id: "ing-1",
        name: "Frango",
        purchaseUnit: "kg",
        purchaseQuantity: 1,
        purchasePrice: 18,
        usedUnit: "g",
        usedQuantity: 180
      },
      {
        id: "ing-2",
        name: "Arroz",
        purchaseUnit: "kg",
        purchaseQuantity: 5,
        purchasePrice: 28,
        usedUnit: "g",
        usedQuantity: 160
      }
    ]
  }
];
