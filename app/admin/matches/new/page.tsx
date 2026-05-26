import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  await requireAdmin();
  redirect("/admin/matches");
}
