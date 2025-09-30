"use client";

import { SessionProvider } from "next-auth/react";

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div
        className="min-h-screen"
        style={{
          backgroundImage: 'url("/image2.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {children}
      </div>
    </SessionProvider>
  );
}
