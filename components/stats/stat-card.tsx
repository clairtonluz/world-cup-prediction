import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
