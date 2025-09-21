"use client";

import { SessionProvider } from "next-auth/react";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen">{children}</div>
    </SessionProvider>
  );
}
