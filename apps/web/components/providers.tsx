"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <SessionProvider>
      {!isAuthPage && <Navigation />}
      <main>{children}</main>
    </SessionProvider>
  );
}

export default Providers;
