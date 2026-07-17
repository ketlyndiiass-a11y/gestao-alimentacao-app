"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { initialPricedProducts } from "@/data/initial-priced-products";
import { legacyProductCategoryMap } from "@/data/mock-data";
import { supabase } from "@/lib/supabase";
import type { Ingredient, IngredientUnit, PricedProduct, PricedProductInput } from "@/types/pricing";

const STORAGE_KEY = "gestao-alimentacao-priced-products";
const PRICED_PRODUCTS_CHANGED_EVENT = "gestao-alimentacao-priced-products-changed";
const PRODUCT_SELECT_FIELDS = `
  id,
  name,
  category,
  packaging_cost,
  extra_costs,
  monthly_fixed_costs,
  expected_monthly_sales,
  margin_percent,
  ifood_fee_percent,
  created_at,
  product_ingredients (
    id,
    name,
    purchase_unit,
    purchase_quantity,
    purchase_price,
    used_unit,
    used_quantity
  )
`;

function storeKey(storeId: string) {
  return `${STORAGE_KEY}:${storeId}`;
}

function normalizeProducts(products: PricedProduct[]) {
  return products.map((product) => ({
    ...product,
    category: legacyProductCategoryMap[product.category] ?? product.category,
    packagingCost: product.packagingCost ?? 0,
    monthlyFixedCosts: product.monthlyFixedCosts ?? 0,
    expectedMonthlySales: product.expectedMonthlySales ?? 0,
    ingredients: product.ingredients.map((ingredient) => ({
      ...ingredient,
      usedUnit: ingredient.usedUnit ?? ingredient.purchaseUnit
    }))
  }));
}

function readStoredProducts(storeId: string) {
  if (typeof window === "undefined") {
    return storeId === "store-main" ? initialPricedProducts : [];
  }

  const stored = window.localStorage.getItem(storeKey(storeId));

  if (!stored) {
    const legacyStored = window.localStorage.getItem(STORAGE_KEY);
    if (storeId === "store-main" && legacyStored) {
      const legacyProducts = normalizeProducts(JSON.parse(legacyStored) as PricedProduct[]);
      window.localStorage.setItem(storeKey(storeId), JSON.stringify(legacyProducts));
      return legacyProducts;
    }
    return storeId === "store-main" ? initialPricedProducts : [];
  }

  try {
    return normalizeProducts(JSON.parse(stored) as PricedProduct[]);
  } catch {
    return storeId === "store-main" ? initialPricedProducts : [];
  }
}

type IngredientRow = {
  id: string;
  name: string;
  purchase_unit: IngredientUnit;
  purchase_quantity: number | string;
  purchase_price: number | string;
  used_unit: IngredientUnit;
  used_quantity: number | string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  packaging_cost: number | string;
  extra_costs: number | string;
  monthly_fixed_costs: number | string;
  expected_monthly_sales: number | string;
  margin_percent: number | string;
  ifood_fee_percent: number | string;
  created_at: string;
  product_ingredients?: IngredientRow[] | null;
};

function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    purchaseUnit: row.purchase_unit,
    purchaseQuantity: Number(row.purchase_quantity),
    purchasePrice: Number(row.purchase_price),
    usedUnit: row.used_unit,
    usedQuantity: Number(row.used_quantity)
  };
}

function mapProduct(row: ProductRow): PricedProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ingredients: (row.product_ingredients ?? []).map(mapIngredient),
    packagingCost: Number(row.packaging_cost),
    extraCosts: Number(row.extra_costs),
    monthlyFixedCosts: Number(row.monthly_fixed_costs),
    expectedMonthlySales: Number(row.expected_monthly_sales),
    marginPercent: Number(row.margin_percent),
    ifoodFeePercent: Number(row.ifood_fee_percent),
    createdAt: row.created_at.slice(0, 10)
  };
}

function toProductPayload(input: PricedProductInput, userId: string, storeId: string) {
  return {
    user_id: userId,
    store_id: storeId,
    name: input.name,
    category: input.category,
    packaging_cost: input.packagingCost,
    extra_costs: input.extraCosts,
    monthly_fixed_costs: input.monthlyFixedCosts,
    expected_monthly_sales: input.expectedMonthlySales,
    margin_percent: input.marginPercent,
    ifood_fee_percent: input.ifoodFeePercent
  };
}

function toIngredientPayload(ingredient: Ingredient, productId: string, userId: string, storeId: string) {
  return {
    product_id: productId,
    user_id: userId,
    store_id: storeId,
    name: ingredient.name,
    purchase_unit: ingredient.purchaseUnit,
    purchase_quantity: ingredient.purchaseQuantity,
    purchase_price: ingredient.purchasePrice,
    used_unit: ingredient.usedUnit,
    used_quantity: ingredient.usedQuantity
  };
}

function notifyPricedProductsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRICED_PRODUCTS_CHANGED_EVENT));
  }
}

function showProductError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function usePricedProducts() {
  const { user, loading: authLoading } = useAuth();
  const { activeStoreId } = useStore();
  const [products, setProducts] = useState<PricedProduct[]>(initialPricedProducts);
  const [hydrated, setHydrated] = useState(false);
  const useRemoteProducts = Boolean(supabase && user && activeStoreId !== "store-main");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user && activeStoreId !== "store-main") {
      let cancelled = false;
      const userId = user.id;

      async function loadRemoteProducts() {
        setHydrated(false);

        const { data, error } = await supabase!
          .from("priced_products")
          .select(PRODUCT_SELECT_FIELDS)
          .eq("user_id", userId)
          .eq("store_id", activeStoreId)
          .order("created_at", { ascending: false });

        if (cancelled) {
          return;
        }

        if (error) {
          showProductError("Não foi possível carregar os produtos precificados no Supabase.");
          setProducts([]);
          setHydrated(true);
          return;
        }

        setProducts(((data ?? []) as unknown as ProductRow[]).map(mapProduct));
        setHydrated(true);
      }

      loadRemoteProducts();

      const reloadProducts = () => {
        loadRemoteProducts();
      };

      window.addEventListener(PRICED_PRODUCTS_CHANGED_EVENT, reloadProducts);

      return () => {
        cancelled = true;
        window.removeEventListener(PRICED_PRODUCTS_CHANGED_EVENT, reloadProducts);
      };
    }

    setHydrated(false);
    setProducts(readStoredProducts(activeStoreId));
    setHydrated(true);
  }, [activeStoreId, authLoading, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && hydrated && !useRemoteProducts) {
      window.localStorage.setItem(storeKey(activeStoreId), JSON.stringify(products));
    }
  }, [activeStoreId, hydrated, products, useRemoteProducts]);

  async function addProduct(input: PricedProductInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data: productData, error: productError } = await supabase
        .from("priced_products")
        .insert(toProductPayload(input, user.id, activeStoreId))
        .select("id")
        .single();

      if (productError || !productData) {
        showProductError("Não foi possível salvar este produto no Supabase.");
        return;
      }

      const productId = productData.id as string;
      const ingredientsPayload = input.ingredients.map((ingredient) =>
        toIngredientPayload(ingredient, productId, user.id, activeStoreId)
      );

      const { error: ingredientsError } = await supabase
        .from("product_ingredients")
        .insert(ingredientsPayload);

      if (ingredientsError) {
        await supabase.from("priced_products").delete().eq("id", productId).eq("user_id", user.id);
        showProductError("Não foi possível salvar os ingredientes deste produto.");
        return;
      }

      const { data } = await supabase
        .from("priced_products")
        .select(PRODUCT_SELECT_FIELDS)
        .eq("id", productId)
        .single();

      if (data) {
        setProducts((current) => [mapProduct(data as unknown as ProductRow), ...current]);
        notifyPricedProductsChanged();
      }

      return;
    }

    setProducts((current) => [
      {
        ...input,
        id: `priced-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...current
    ]);
    notifyPricedProductsChanged();
  }

  async function updateProduct(id: string, input: PricedProductInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { error: productError } = await supabase
        .from("priced_products")
        .update(toProductPayload(input, user.id, activeStoreId))
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId);

      if (productError) {
        showProductError("Não foi possível atualizar este produto.");
        return;
      }

      const { error: deleteIngredientsError } = await supabase
        .from("product_ingredients")
        .delete()
        .eq("product_id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId);

      if (deleteIngredientsError) {
        showProductError("Não foi possível atualizar os ingredientes deste produto.");
        return;
      }

      const { error: ingredientsError } = await supabase
        .from("product_ingredients")
        .insert(
          input.ingredients.map((ingredient) =>
            toIngredientPayload(ingredient, id, user.id, activeStoreId)
          )
        );

      if (ingredientsError) {
        showProductError("Não foi possível salvar os novos ingredientes deste produto.");
        return;
      }

      const { data } = await supabase
        .from("priced_products")
        .select(PRODUCT_SELECT_FIELDS)
        .eq("id", id)
        .single();

      if (data) {
        setProducts((current) =>
          current.map((product) => (product.id === id ? mapProduct(data as unknown as ProductRow) : product))
        );
        notifyPricedProductsChanged();
      }

      return;
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? {
              ...product,
              ...input
            }
          : product
      )
    );
    notifyPricedProductsChanged();
  }

  async function deleteProduct(id: string) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { error } = await supabase
        .from("priced_products")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId);

      if (error) {
        showProductError("Não foi possível excluir este produto.");
        return;
      }

      setProducts((current) => current.filter((product) => product.id !== id));
      notifyPricedProductsChanged();
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== id));
    notifyPricedProductsChanged();
  }

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
