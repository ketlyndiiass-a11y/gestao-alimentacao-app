import { Card } from "@/components/ui/card";

type EmptyPageProps = {
  title: string;
  description: string;
};

export function EmptyPage({ title, description }: EmptyPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <p className="text-sm font-medium text-muted">Modulo</p>
      <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
      <Card className="mt-5 p-6">
        <p className="text-muted">{description}</p>
      </Card>
    </div>
  );
}
