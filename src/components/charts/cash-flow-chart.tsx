type CashFlowPoint = {
  label: string;
  entradas: number;
  saidas: number;
};

type CashFlowChartProps = {
  data: CashFlowPoint[];
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  const max = Math.max(...data.flatMap((item) => [item.entradas, item.saidas]), 1);

  return (
    <div className="h-64 w-full rounded-lg border border-line/80 bg-canvas/80 p-4">
      <div className="flex h-full items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center gap-1 rounded-lg bg-white/70 px-1 pb-2">
              <div
                className="w-3 rounded-t-lg bg-success shadow-sm transition-all"
                style={{ height: `${Math.max((item.entradas / max) * 100, item.entradas ? 6 : 0)}%` }}
                title={`Entradas: ${item.entradas}`}
              />
              <div
                className="w-3 rounded-t-lg bg-danger shadow-sm transition-all"
                style={{ height: `${Math.max((item.saidas / max) * 100, item.saidas ? 6 : 0)}%` }}
                title={`Saídas: ${item.saidas}`}
              />
            </div>
            <span className="text-xs font-semibold text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
