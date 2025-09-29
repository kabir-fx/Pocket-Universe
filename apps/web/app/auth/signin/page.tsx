"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { SigninCard } from "@repo/ui/signup-card";

function SignInInner() {
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  async function handleSubmit({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    setSubmitting(true);
    try {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/playground",
        redirect: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SigninCard
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      submitting={submitting}
      errorMessage={
        errorParam ? "Invalid credentials. Please try again." : null
      }
      onSubmit={handleSubmit}
      onGithubClick={() => signIn("github", { callbackUrl: "/playground" })}
      onGoogleClick={() => signIn("google", { callbackUrl: "/playground" })}
    />
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
