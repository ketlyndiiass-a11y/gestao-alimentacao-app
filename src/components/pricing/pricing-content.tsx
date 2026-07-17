"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { PricingForm } from "@/components/pricing/pricing-form";
import { PricedProductList } from "@/components/pricing/priced-product-list";
import { Card } from "@/components/ui/card";
import { productCategories } from "@/data/mock-data";
import { useBills } from "@/hooks/use-bills";
import { usePricedProducts } from "@/hooks/use-priced-products";
import { cn } from "@/lib/utils";
import type { PricedProduct } from "@/types/pricing";

export function PricingContent() {
  const { products, addProduct, updateProduct, deleteProduct } = usePricedProducts();
  const { totals } = useBills();
  const [openCategory, setOpenCategory] = useState(productCategories[0]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PricedProduct | null>(null);

  function openNewProductForm() {
    setEditingProduct(null);
    setShowCalculator((current) => !current);
  }

  function handleEdit(product: PricedProduct) {
    setEditingProduct(product);
    setOpenCategory(product.category);
    setShowCalculator(true);
  }

  function handleDelete(product: PricedProduct) {
    const confirmed = window.confirm(
      `Deseja confirmar a exclusão do produto "${product.name}"?`
    );

    if (confirmed) {
      deleteProduct(product.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Produtos</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Precificação</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Calcule o custo do produto, preço de balcão e preço para delivery com taxa do iFood.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewProductForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white"
        >
          <Plus size={18} />
          Cadastrar produto
        </button>
      </div>

      {showCalculator && (
        <Card className="mt-5 p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h3 className="text-lg font-semibold">
              {editingProduct ? "Editar produto precificado" : "Calculadora de precificação"}
            </h3>
            <p className="text-sm text-muted">
              O custo fixo mensal vem automaticamente da aba Contas. Aqui você informa a
              previsão de vendas para ratear esse custo por produto.
            </p>
          </div>
          <PricingForm
            key={editingProduct?.id ?? `new-${openCategory}`}
            onSubmit={async (product) => {
              if (editingProduct) {
                await updateProduct(editingProduct.id, product);
              } else {
                await addProduct(product);
              }

              setOpenCategory(product.category);
              setShowCalculator(false);
              setEditingProduct(null);
            }}
            selectedCategory={openCategory}
            monthlyFixedCosts={totals.monthlyFixed}
            initialProduct={editingProduct}
            onCancel={() => {
              setShowCalculator(false);
              setEditingProduct(null);
            }}
          />
        </Card>
      )}

      <section className="mt-5 grid gap-3">
        {productCategories.map((category) => {
          const categoryProducts = products.filter((product) => product.category === category);
          const open = openCategory === category;

          return (
            <Card key={category} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCategory(open ? "" : category)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <h3 className="font-semibold">{category}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {categoryProducts.length}{" "}
                    {categoryProducts.length === 1 ? "produto salvo" : "produtos salvos"}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className={cn("text-muted transition", open && "rotate-180")}
                />
              </button>

              {open && (
                <div className="border-t border-line px-5 py-2">
                  <PricedProductList
                    products={categoryProducts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
