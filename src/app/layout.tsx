import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";
import { QuickAdd } from "@/components/quick-add";
import { themeScript } from "@/components/theme";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "HisIn — Inglés técnico para healtech y emprendedores",
  description:
    "Aprendé y reforzá tu inglés técnico: healtech, emprendimiento, negocios y contratos, con repaso espaciado e historias.",
};

/** Streak and XP live in Postgres; this boundary keeps the shell prerenderable. */
async function NavData() {
  // The shell is per-request state: declare it so no static route tries to
  // prerender a value that changes between renders.
  await connection();
  const user = await getLocalUser();
  const counters = await new ProgressRepository().getShellCounters(user.id);
  return (
    <AppNav
      streak={counters.streak}
      xp={counters.xp}
      context={{ discipline: counters.discipline, minutes: counters.minutes }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="h-[57px] border-b border-slate-200 bg-white/80" aria-hidden="true" />
          }
        >
          <NavData />
        </Suspense>
        <main className="max-w-5xl mx-auto px-4 py-8 pb-24">{children}</main>
        <QuickAdd />
        <footer className="max-w-5xl mx-auto px-4 pb-8 pt-2 text-xs text-slate-400">
          <Link href="/studio" className="hover:text-indigo-600">
            Generar contenido
          </Link>
        </footer>
      </body>
    </html>
  );
}
