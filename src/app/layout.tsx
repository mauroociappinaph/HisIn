import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HisIn — Inglés técnico para healtech y emprendedores",
  description:
    "Aprendé y reforzá tu inglés técnico: healtech, emprendimiento, negocios y contratos. Test de nivel inicial y práctica adaptativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl text-indigo-600">
              HisIn
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/test" className="hover:text-indigo-600">
                Test de nivel
              </Link>
              <Link href="/dashboard" className="hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/review/vocab" className="hover:text-indigo-600">
                Repaso SRS
              </Link>
              <Link href="/progress" className="hover:text-indigo-600">
                Progreso
              </Link>
              <Link href="/studio" className="hover:text-indigo-600">
                Generar
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
