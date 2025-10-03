"use client";

import { PlgCard } from "@repo/ui/plg-card";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Homeer() {
  const [submitting, setSubmitting] = useState(false);
  const [galaxies, setGalaxies] = useState<{ id: string; name: string }[]>([]);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchGalaxies = async () => {
    try {
      const response = await fetch("/api/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await response.json().catch(() => []);
      if (Array.isArray(data)) {
        const mapped = data.map((g: any) => ({ id: g.id, name: g.name }));
        setGalaxies(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch galaxies:", error);
    }
  };

  useEffect(() => {
    fetchGalaxies();
  }, []);

  async function handleSubmit({
    galaxy,
    planet,
    onSuccess,
  }: {
    galaxy?: string;
    planet: string;
    onSuccess?: () => void;
  }) {
    if (!planet) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Only call galaxyCheck if galaxy is provided and not empty
      if (galaxy && galaxy.trim()) {
        const galaxyRes = await fetch("/api/playground/galaxyCheck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galaxy: galaxy.trim() }),
        });

        if (!galaxyRes.ok) {
          const body = await galaxyRes.json().catch(() => ({}));

          if (galaxyRes.status === 401) {
            setErrorMsg("Please sign in to continue.");
            return;
          }

          setErrorMsg(body?.error || "Galaxy creation failed");
          return;
        }
      }

      const planetRes = await fetch("/api/playground/planetCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planet: planet,
          galaxy: galaxy && galaxy.trim() ? galaxy.trim() : undefined,
        }),
      });

      if (!planetRes.ok) {
        const body = await planetRes.json().catch(() => ({}));

        if (planetRes.status === 401) {
          setErrorMsg("Please sign in to continue.");
          return;
        }

        setErrorMsg(body?.error || "Planet creation failed");
        return;
      }

      // Success!
      setSuccessMsg("Planet created successfully!");
      // Refresh galaxies list to show any newly created galaxy
      await fetchGalaxies();
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PlgCard
      title="Create Your Universe"
      subtitle="Build customizable folders to organize your links and ideas"
      submitting={submitting}
      errorMsg={errorMsg ?? (errorParam ? "Invalid input" : null)}
      successMsg={successMsg}
      galaxies={galaxies}
      backgroundColor="transparent"
      cardBackgroundColor="transparent"
      showShadows={false}
      onSubmit={handleSubmit}
      onAiSubmit={async ({ planet, onSuccess }) => {
        if (!planet) return;
        setSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          const res = await fetch('/api/ai/pipeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: planet })
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            if (res.status === 401) {
              setErrorMsg('Please sign in to continue.');
            } else {
              setErrorMsg(body?.error || 'AI pipeline failed');
            }
            return;
          }
          setSuccessMsg('Saved with AI! You can review it on your dashboard anytime.');
          // Refresh local folders list in case a new folder was created by AI
          await fetchGalaxies();
          if (onSuccess) onSuccess();
        } finally {
          setSubmitting(false);
        }
      }}
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
