import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavLink } from "@/components/ui/NavLink";
import { ComandaProvider } from "@/lib/comanda-context";
import { ResumenComanda } from "@/components/ui/ResumenComanda";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comandero",
  description: "Sistema de gestión de comandas para restaurante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <ComandaProvider>
          <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
            <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Comandero
              </span>
              <div className="flex gap-1">
                <NavLink href="/">Comandas</NavLink>
                <NavLink href="/gestion">Gestión</NavLink>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-24">
            {children}
          </main>
          <ResumenComanda />
        </ComandaProvider>
      </body>
    </html>
  );
}
