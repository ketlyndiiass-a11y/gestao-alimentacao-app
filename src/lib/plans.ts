export type PlanId = "essential" | "management" | "elite";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceCents: number;
  storeLimit: number;
  deviceLimit: number;
  highlight?: string;
};

export const plans: Plan[] = [
  {
    id: "essential",
    name: "Essencial",
    price: "R$ 29,90/mês",
    priceCents: 2990,
    storeLimit: 1,
    deviceLimit: 2,
    highlight: "Ideal para uma loja"
  },
  {
    id: "management",
    name: "Gestão",
    price: "R$ 49,90/mês",
    priceCents: 4990,
    storeLimit: 2,
    deviceLimit: 3,
    highlight: "Para negócios com mais de uma operação"
  },
  {
    id: "elite",
    name: "Elite",
    price: "R$ 79,90/mês",
    priceCents: 7990,
    storeLimit: 3,
    deviceLimit: 5,
    highlight: "Para operação maior com equipe"
  }
];

export const fallbackPlan = plans[0];

export function formatPlanPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(priceCents / 100);
}

export function findPlan(id?: string | null) {
  return plans.find((plan) => plan.id === id) ?? fallbackPlan;
}
