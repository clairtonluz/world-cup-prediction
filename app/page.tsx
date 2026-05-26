import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (session?.user && isUser(session.user)) {
    redirect("/matches");
  }

  redirect("/login");
}
