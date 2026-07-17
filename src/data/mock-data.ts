// Dados fictícios para a primeira etapa. Depois eles serão trocados por dados do Supabase.
export const monthlySummary = {
  revenue: 18540,
  expenses: 11980,
  net: 6560,
  target: 25000
};

export const cashFlow = [
  { label: "01", entradas: 840, saidas: 320 },
  { label: "05", entradas: 1250, saidas: 640 },
  { label: "10", entradas: 980, saidas: 1720 },
  { label: "15", entradas: 1640, saidas: 820 },
  { label: "20", entradas: 2210, saidas: 1090 },
  { label: "25", entradas: 1920, saidas: 760 },
  { label: "30", entradas: 2480, saidas: 980 }
];

export const reminders = [
  { title: "Aluguel", due: "Dia 10", amount: 1800 },
  { title: "Energia", due: "Dia 15", amount: 620 },
  { title: "Fornecedor de carnes", due: "Dia 20", amount: 1450 }
];

export const topExpenses = [
  { name: "Insumos", value: 4380 },
  { name: "Funcionários", value: 3200 },
  { name: "Aluguel", value: 1800 },
  { name: "Embalagens", value: 910 }
];

export const productCategories = [
  "Marmita",
  "Lanches",
  "Hambúrgueres",
  "Pizzas",
  "Confeitaria",
  "Porções",
  "Outros"
];

export const legacyProductCategoryMap: Record<string, string> = {
  Marmitaria: "Marmita",
  Lancheria: "Lanches",
  Hamburgueria: "Hambúrgueres",
  Pizzaria: "Pizzas",
  Porcoes: "Porções"
};
