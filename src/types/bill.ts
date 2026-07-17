export type BillStatus = "pendente" | "paga" | "atrasada";
export type BillRecurrence = "unica" | "mensal";
export type BillKind = "fixed" | "bill";

export type Bill = {
  id: string;
  kind: BillKind;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  recurrence: BillRecurrence;
  paidAt?: string;
  paymentMethod?: string;
  bank?: string;
  notes?: string;
};

export type BillInput = Omit<Bill, "id">;
