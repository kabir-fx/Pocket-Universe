"use client"

import SignupCard from "@repo/ui/signup-card";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
    const router = useRouter();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit({ username, password, email }: { username: string; password: string; email: string }) {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password , email })
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
        />
    );
}