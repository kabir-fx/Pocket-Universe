"use client";

import { SessionProvider } from "next-auth/react";
import { Navigation } from "./navigation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <Navigation />
      <main>{children}</main>
    </SessionProvider>
  );
}

export default Providers;
