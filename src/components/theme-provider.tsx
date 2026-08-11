"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * The app opens in light mode for everyone, even if the phone or the laptop is
 * set to dark. Whoever prefers dark can switch it from their account menu, and
 * that choice is remembered on that device.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
