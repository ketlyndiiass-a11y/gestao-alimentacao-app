import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  const Icon = tone === "success" ? ArrowUpRight : tone === "danger" ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-line/80 bg-white p-4 shadow-lift",
        "before:absolute before:inset-x-0 before:top-0 before:h-1",
        tone === "success" && "before:bg-success",
        tone === "danger" && "before:bg-danger",
        tone === "default" && "before:bg-brand"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "success" && "bg-success/10 text-success",
            tone === "danger" && "bg-danger/10 text-danger",
            tone === "default" && "bg-brand/10 text-brand"
          )}
        >
          <Icon size={17} />
        </span>
      </div>
      <strong
        className={cn(
          "mt-3 block text-2xl font-semibold tracking-tight text-ink",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </strong>
    </div>
  );
}
