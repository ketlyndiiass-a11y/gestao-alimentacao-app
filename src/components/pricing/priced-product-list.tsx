import { Edit2, Trash2 } from "lucide-react";
import { calculateProductPricing } from "@/lib/pricing";
import { currency } from "@/lib/utils";
import type { PricedProduct } from "@/types/pricing";

type PricedProductListProps = {
  products: PricedProduct[];
  onEdit: (product: PricedProduct) => void;
  onDelete: (product: PricedProduct) => void;
};

export function PricedProductList({ products, onEdit, onDelete }: PricedProductListProps) {
  if (products.length === 0) {
    return <p className="text-muted">Nenhum produto precificado ainda.</p>;
  }

  return (
    <div className="divide-y divide-line">
      {products.map((product) => {
        const pricing = calculateProductPricing(product);

        return (
          <div key={product.id} className="grid gap-3 py-4 xl:grid-cols-[1fr_auto] xl:items-center">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted">
                {product.category} • {product.ingredients.length} insumos • margem{" "}
                {product.marginPercent}%
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold"
                >
                  <Edit2 size={15} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-danger"
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right text-sm md:grid-cols-4">
              <div>
                <p className="text-muted">Insumos</p>
                <strong>{currency(pricing.ingredientsCost)}</strong>
              </div>
              <div>
                <p className="text-muted">Custo total</p>
                <strong>{currency(pricing.totalCost)}</strong>
              </div>
              <div>
                <p className="text-muted">Balcão</p>
                <strong className="text-success">{currency(pricing.counterPrice)}</strong>
              </div>
              <div>
                <p className="text-muted">iFood</p>
                <strong className="text-success">{currency(pricing.ifoodPrice)}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
