import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SimulationProvider } from "@/features/simulation/SimulationProvider";
import { AppShell } from "@/components/layout/AppShell";
const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
export const metadata: Metadata = {
  title: "NLNG · People & Payroll",
  description: "Replayable HR and payroll source-system simulation",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <SimulationProvider>
          <AppShell>{children}</AppShell>
        </SimulationProvider>
      </body>
    </html>
  );
}
