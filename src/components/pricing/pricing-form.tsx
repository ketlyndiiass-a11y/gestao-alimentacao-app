"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { productCategories } from "@/data/mock-data";
import { calculateIngredientCost, calculateProductPricing } from "@/lib/pricing";
import { currency } from "@/lib/utils";
import type { Ingredient, IngredientUnit, PricedProduct, PricedProductInput } from "@/types/pricing";

type PricingFormProps = {
  onSubmit: (product: PricedProductInput) => Promise<void> | void;
  selectedCategory: string;
  monthlyFixedCosts: number;
  initialProduct?: PricedProduct | null;
  onCancel?: () => void;
};

const units: IngredientUnit[] = ["kg", "g", "l", "ml", "unidade", "pacote"];

function createIngredient(): Ingredient {
  return {
    id: `ingredient-${crypto.randomUUID()}`,
    name: "",
    purchaseUnit: "kg",
    purchaseQuantity: 1,
    purchasePrice: 0,
    usedUnit: "g",
    usedQuantity: 0
  };
}

function parseNumber(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized) || 0;
}

function formatEditableNumber(value: number) {
  return value ? String(value).replace(".", ",") : "";
}

export function PricingForm({
  onSubmit,
  selectedCategory,
  monthlyFixedCosts,
  initialProduct,
  onCancel
}: PricingFormProps) {
  const firstIngredient = useMemo(() => createIngredient(), []);
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState(initialProduct?.category ?? selectedCategory);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialProduct?.ingredients ?? [firstIngredient]
  );
  const [collapsedIngredientIds, setCollapsedIngredientIds] = useState<string[]>(
    initialProduct?.ingredients.map((ingredient) => ingredient.id) ?? []
  );
  const [packagingCost, setPackagingCost] = useState(
    initialProduct ? formatEditableNumber(initialProduct.packagingCost) : "0"
  );
  const [extraCosts, setExtraCosts] = useState(
    initialProduct ? formatEditableNumber(initialProduct.extraCosts) : "0"
  );
  const [expectedMonthlySales, setExpectedMonthlySales] = useState(
    initialProduct ? formatEditableNumber(initialProduct.expectedMonthlySales) : "1200"
  );
  const [marginPercent, setMarginPercent] = useState(
    initialProduct ? formatEditableNumber(initialProduct.marginPercent) : "35"
  );
  const [ifoodFeePercent, setIfoodFeePercent] = useState(
    initialProduct ? formatEditableNumber(initialProduct.ifoodFeePercent) : "20"
  );

  useEffect(() => {
    if (!initialProduct) {
      setCategory(selectedCategory);
    }
  }, [initialProduct, selectedCategory]);

  useEffect(() => {
    if (!initialProduct) {
      return;
    }

    setName(initialProduct.name);
    setCategory(initialProduct.category);
    setIngredients(initialProduct.ingredients);
    setCollapsedIngredientIds(initialProduct.ingredients.map((ingredient) => ingredient.id));
    setPackagingCost(formatEditableNumber(initialProduct.packagingCost));
    setExtraCosts(formatEditableNumber(initialProduct.extraCosts));
    setExpectedMonthlySales(formatEditableNumber(initialProduct.expectedMonthlySales));
    setMarginPercent(formatEditableNumber(initialProduct.marginPercent));
    setIfoodFeePercent(formatEditableNumber(initialProduct.ifoodFeePercent));
  }, [initialProduct]);

  const previewProduct: PricedProduct = useMemo(
    () => ({
      id: initialProduct?.id ?? "preview",
      name,
      category,
      ingredients,
      packagingCost: parseNumber(packagingCost),
      extraCosts: parseNumber(extraCosts),
      monthlyFixedCosts,
      expectedMonthlySales: parseNumber(expectedMonthlySales),
      marginPercent: parseNumber(marginPercent),
      ifoodFeePercent: parseNumber(ifoodFeePercent),
      createdAt: initialProduct?.createdAt ?? new Date().toISOString().slice(0, 10)
    }),
    [
      category,
      expectedMonthlySales,
      extraCosts,
      ifoodFeePercent,
      ingredients,
      initialProduct,
      marginPercent,
      monthlyFixedCosts,
      name,
      packagingCost
    ]
  );

  const pricing = calculateProductPricing(previewProduct);

  function updateIngredient(id: string, updates: Partial<Ingredient>) {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...updates } : ingredient
      )
    );
  }

  function removeIngredient(id: string) {
    setCollapsedIngredientIds((current) =>
      current.filter((ingredientId) => ingredientId !== id)
    );
    setIngredients((current) =>
      current.length === 1 ? current : current.filter((ingredient) => ingredient.id !== id)
    );
  }

  function addIngredient() {
    setIngredients((current) => [...current, createIngredient()]);
  }

  function collapseIngredient(id: string) {
    setCollapsedIngredientIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
  }

  function expandIngredient(id: string) {
    setCollapsedIngredientIds((current) =>
      current.filter((ingredientId) => ingredientId !== id)
    );
  }

  function resetForm() {
    const ingredient = createIngredient();
    setName("");
    setIngredients([ingredient]);
    setCollapsedIngredientIds([]);
    setPackagingCost("0");
    setExtraCosts("0");
    setExpectedMonthlySales("1200");
    setMarginPercent("35");
    setIfoodFeePercent("20");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validIngredients = ingredients.filter(
      (ingredient) =>
        ingredient.name.trim() &&
        ingredient.purchaseQuantity > 0 &&
        ingredient.purchasePrice > 0 &&
        ingredient.usedQuantity > 0
    );

    if (!name.trim() || validIngredients.length === 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      category,
      ingredients: validIngredients.map((ingredient) => ({
        ...ingredient,
        name: ingredient.name.trim()
      })),
      packagingCost: parseNumber(packagingCost),
      extraCosts: parseNumber(extraCosts),
      monthlyFixedCosts,
      expectedMonthlySales: parseNumber(expectedMonthlySales),
      marginPercent: parseNumber(marginPercent),
      ifoodFeePercent: parseNumber(ifoodFeePercent)
    });

    if (!initialProduct) {
      resetForm();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Nome do produto</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Marmita de frango"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Categoria</span>
          <select
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {productCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">Ingredientes e insumos</h4>
            <p className="text-sm text-muted">
              Informe quanto comprou, quanto pagou e quanto usa nesse produto.
            </p>
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Adicionar item
          </button>
        </div>

        {ingredients.map((ingredient, index) => {
          const ingredientCost = calculateIngredientCost(ingredient);
          const collapsed = collapsedIngredientIds.includes(ingredient.id);

          return (
            <div key={ingredient.id} className="rounded-lg border border-line bg-white p-4">
              {collapsed ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted">Item {index + 1}</p>
                    <strong>{ingredient.name || "Item sem nome"}</strong>
                    <p className="mt-1 text-sm text-muted">
                      Custo no produto: {currency(ingredientCost)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => expandIngredient(ingredient.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold"
                    >
                      <Edit2 size={15} />
                      Editar item
                    </button>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="flex size-9 items-center justify-center rounded-lg border border-line text-danger"
                      aria-label="Remover ingrediente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <strong>Item {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="flex size-9 items-center justify-center rounded-lg border border-line text-danger"
                      aria-label="Remover ingrediente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">Nome do item</span>
                      <input
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        value={ingredient.name}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, { name: event.target.value })
                        }
                        placeholder="Ex: arroz, frango, queijo"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">Unidade da compra</span>
                      <select
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        value={ingredient.purchaseUnit}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            purchaseUnit: event.target.value as IngredientUnit
                          })
                        }
                      >
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">Quantidade comprada</span>
                      <input
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        defaultValue={formatEditableNumber(ingredient.purchaseQuantity)}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            purchaseQuantity: parseNumber(event.target.value)
                          })
                        }
                        inputMode="decimal"
                        placeholder="Ex: 5 para 5 kg"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">
                        Valor pago nessa compra
                      </span>
                      <input
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        defaultValue={formatEditableNumber(ingredient.purchasePrice)}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            purchasePrice: parseNumber(event.target.value)
                          })
                        }
                        inputMode="decimal"
                        placeholder="Ex: 22,88"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">Unidade usada</span>
                      <select
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        value={ingredient.usedUnit}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            usedUnit: event.target.value as IngredientUnit
                          })
                        }
                      >
                        {units.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-muted">
                        Quantidade usada no produto
                      </span>
                      <input
                        className="rounded-lg border border-line px-3 py-3 outline-none focus:border-brand"
                        defaultValue={formatEditableNumber(ingredient.usedQuantity)}
                        onChange={(event) =>
                          updateIngredient(ingredient.id, {
                            usedQuantity: parseNumber(event.target.value)
                          })
                        }
                        inputMode="decimal"
                        placeholder="Ex: 160 para 160 g"
                      />
                    </label>
                  </div>

                  <div className="mt-4 rounded-lg bg-canvas px-4 py-3">
                    <p className="text-sm text-muted">Custo deste item no produto</p>
                    <strong className="text-lg">{currency(ingredientCost)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => collapseIngredient(ingredient.id)}
                    className="mt-3 rounded-lg bg-brand px-4 py-3 font-semibold text-white"
                  >
                    Salvar item
                  </button>
                </>
              )}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Embalagem por unidade</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={packagingCost}
            onChange={(event) => setPackagingCost(event.target.value)}
            inputMode="decimal"
            placeholder="Ex: 2,00"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Custos extras por unidade</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={extraCosts}
            onChange={(event) => setExtraCosts(event.target.value)}
            inputMode="decimal"
            placeholder="Ex: gás, etiqueta, guardanapo"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-line bg-canvas px-3 py-3">
          <span className="text-sm font-medium text-muted">
            Custo fixo mensal vindo de Contas
          </span>
          <strong className="mt-2 block text-lg">{currency(monthlyFixedCosts)}</strong>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Previsão de vendas/mês</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={expectedMonthlySales}
            onChange={(event) => setExpectedMonthlySales(event.target.value)}
            inputMode="decimal"
            placeholder="Ex: 2000"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">
            Margem de lucro desejada (%)
          </span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={marginPercent}
            onChange={(event) => setMarginPercent(event.target.value)}
            inputMode="decimal"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Taxa iFood (%)</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={ifoodFeePercent}
            onChange={(event) => setIfoodFeePercent(event.target.value)}
            inputMode="decimal"
          />
        </label>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-canvas p-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-muted">Ingredientes</p>
          <strong className="text-lg">{currency(pricing.ingredientsCost)}</strong>
        </div>
        <div>
          <p className="text-sm text-muted">Embalagem</p>
          <strong className="text-lg">{currency(pricing.packagingCost)}</strong>
        </div>
        <div>
          <p className="text-sm text-muted">Fixo por unidade</p>
          <strong className="text-lg">{currency(pricing.fixedCostPerUnit)}</strong>
        </div>
        <div>
          <p className="text-sm text-muted">Custo total</p>
          <strong className="text-lg">{currency(pricing.totalCost)}</strong>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Preço de balcão</p>
          <strong className="text-xl text-success">{currency(pricing.counterPrice)}</strong>
          <p className="mt-1 text-xs text-muted">
            Lucro estimado: {currency(pricing.counterProfit)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Preço no iFood</p>
          <strong className="text-xl text-success">{currency(pricing.ifoodPrice)}</strong>
          <p className="mt-1 text-xs text-muted">
            Lucro após taxa: {currency(pricing.ifoodProfit)}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-lg bg-brand px-4 py-3 font-semibold text-white">
          {initialProduct ? "Salvar alterações" : "Salvar produto precificado"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-4 py-3 font-semibold"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
