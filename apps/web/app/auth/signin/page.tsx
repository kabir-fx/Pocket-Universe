"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@repo/ui/auth-card";
import Link from "next/link";

function SignInInner() {
    const [submitting, setSubmitting] = useState(false);
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    async function handleSubmit({ username, password }: { username: string; password: string }) {
        setSubmitting(true);
        try {
            await signIn("credentials", {
                username,
                password,
                callbackUrl: "/playground",
                redirect: true,
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthCard
            submitting={submitting}
            errorMessage={errorParam ? "Invalid credentials. Please try again." : null}
            onSubmit={handleSubmit}
            footer={<span>Don't have an account? <Link href="/auth/signup">Sign up</Link></span>}
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