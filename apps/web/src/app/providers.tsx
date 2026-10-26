"use client";

import { ThemeProvider } from "next-themes";
import { CompareProvider } from "@/context/compare";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <CompareProvider>{children}</CompareProvider>
    </ThemeProvider>
  );
}
