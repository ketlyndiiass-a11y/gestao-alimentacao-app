import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line/80 bg-panel shadow-lift backdrop-blur transition-shadow",
        className
      )}
      {...props}
    />
  );
}
