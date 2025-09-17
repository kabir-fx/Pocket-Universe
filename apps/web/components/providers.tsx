"use client";

import { SessionProvider } from "next-auth/react";
import { Navigation } from "./navigation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main>{children}</main>
      </div>
    </SessionProvider>
  );
}

export default Providers;
