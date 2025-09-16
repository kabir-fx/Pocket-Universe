"use client"

import { PlgCard } from "@repo/ui/plg-card";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function Homeer() {
    const [submitting, setSubmitting] = useState(false);
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    async function handleSubmit({ galaxy, planet }: { galaxy?: string; planet: string }) {
        setSubmitting(true);
        try {
            if (!galaxy) return;

            const res = await fetch("/api/playground/galaxyCheck", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ galaxy: galaxy })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));

                if (res.status === 401) {
                    setErrorMsg("Please sign in to continue.");

                    return;
                }

                setErrorMsg(body?.error || "Galaxy creation failed");
                return;
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <PlgCard
            submitting={submitting}
            errorMsg={errorMsg ?? (errorParam ? "Invalid input" : null)}
            onSubmit={handleSubmit}
        />
    );
}

export default function PglPage() {
    return (
        <Suspense fallback={null}>
            <Homeer />
        </Suspense>
    );
}