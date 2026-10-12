import type { Metadata } from "next";
import "./globals.css";
import { SimulationProvider } from "@/features/simulation/SimulationProvider";
import { AppShell } from "@/components/layout/AppShell";
export const metadata: Metadata = {
  title: "NLNG · People & Payroll",
  description: "Replayable HR and payroll source-system simulation",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SimulationProvider>
          <AppShell>{children}</AppShell>
        </SimulationProvider>
      </body>
    </html>
  );
}
