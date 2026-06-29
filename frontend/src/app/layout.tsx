import type { Metadata } from "next";
import "./globals.css";
import { Masthead } from "@/components/layout/Masthead";
import { LocaleProvider } from "@/lib/locale-context";

export const metadata: Metadata = {
  title: "OpenProvena — Standard ouvert de crédibilité de l'information",
  description: "Analysez la fiabilité de toute source d'information en temps réel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-off-white text-ink font-sans antialiased">
        {/* Masthead est autonome — il n'a pas besoin du Provider */}
        <Masthead />
        {/* LocaleProvider synchronise les pages via CustomEvent */}
        <LocaleProvider>
          <main>{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
