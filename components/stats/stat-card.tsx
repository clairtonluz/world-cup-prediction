import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="overflow-hidden border-t-2 border-t-[#0e74e1]">
      <CardContent className="pt-5">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
