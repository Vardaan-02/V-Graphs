"use client"

import React, { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

const ThemeProvider: React.FC<React.ComponentProps<typeof NextThemesProvider> & { children: React.ReactNode }> = ({ children, ...props }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
 setMounted(true);
  }, []);

  if (!mounted) return null;

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};

export default ThemeProvider;