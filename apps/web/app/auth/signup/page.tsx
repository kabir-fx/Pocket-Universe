"use client";

import SignupCard from "@repo/ui/signup-card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { SignupSchema } from "../../../lib/zodValidation/auth";

export default function SignUpPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit({
    name,
    password,
    email,
  }: {
    name: string;
    password: string;
    email: string;
  }) {
    setSubmitting(true);
    setError(null);

    try {
      const parsed = SignupSchema.safeParse({ name, password, email });
      if (!parsed.success) {
        setError(parsed.error.issues?.[0]?.message || "Invalid input");
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Signup failed");
      }

      router.push("/auth/signin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SignupCard
      title="Join us today"
      subtitle="Create your account to get started"
      submitting={submitting}
      errorMessage={error}
      onSubmit={handleSubmit}
      onGithubClick={() => signIn("github", { callbackUrl: "/playground" })}
      onGoogleClick={() => signIn("google", { callbackUrl: "/playground" })}
    />
  );
}
