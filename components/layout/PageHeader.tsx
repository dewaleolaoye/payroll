"use client";
import { createContext, useContext } from "react";
export interface PageHeader {
  title: string;
  description: string;
}
// Pages publish their title here; AppShell renders it in the top bar.
export const PageHeaderContext = createContext<
  (header: PageHeader | null) => void
>(() => {});
export const useSetPageHeader = () => useContext(PageHeaderContext);
