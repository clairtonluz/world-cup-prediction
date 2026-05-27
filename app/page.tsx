import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";
import { isUser } from "@/lib/authorization";

export const metadata: Metadata = {
  title: "Bolão da Copa 2026 | Palpites com amigos",
  description:
    "Entre no bolão privado da Copa do Mundo 2026, dê seus palpites e dispute o ranking com amigos.",
  openGraph: {
    title: "Bolão da Copa 2026 | Palpites com amigos",
    description:
      "Entre no bolão privado da Copa do Mundo 2026, dê seus palpites e dispute o ranking com amigos.",
    locale: "pt_BR",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (session?.user && isUser(session.user)) {
    redirect("/matches");
  }

  if (session?.user) {
    redirect("/login?error=forbidden");
  }

  return <LandingPage />;
}
