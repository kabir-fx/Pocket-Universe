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
    imgDataUrl,
    onSuccess,
  }: {
    galaxy?: string;
    planet: string;
    imgDataUrl?: string;
    onSuccess?: () => void;
  }) {
    if (!planet && !imgDataUrl) return;

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

      const asDataUrl = imgDataUrl?.trim()
        ? imgDataUrl.trim()
        : isDataUrl(planet)
        ? planet
        : null;
      const asUrl = !asDataUrl && planet ? isLikelyImageUrl(planet) : null;

      if (asDataUrl || asUrl) {
        const uploadRes = await fetch("/api/playground/imgStorage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            galaxy: galaxy && galaxy.trim() ? galaxy.trim() : undefined,
            img: asDataUrl
              ? { dataUrl: asDataUrl }
              : { url: asUrl },
          }),
        });

        const body = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          if (uploadRes.status === 415) {
            // Not an image; fallback to planet creation
            const planetRes = await fetch("/api/playground/planetCreate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                planet: planet,
                galaxy: galaxy && galaxy.trim() ? galaxy.trim() : undefined,
              }),
            });

            if (!planetRes.ok) {
              const pbody = await planetRes.json().catch(() => ({}));
              if (planetRes.status === 401) {
                setErrorMsg("Please sign in to continue.");
              } else {
                setErrorMsg(pbody?.error || "Planet creation failed");
              }
              return;
            }
            setSuccessMsg("Planet created successfully!");
            await fetchGalaxies();
            if (onSuccess) onSuccess();
            return;
          }
          if (uploadRes.status === 401) {
            setErrorMsg("Please sign in to continue.");
            return;
          }
          setErrorMsg(body?.message || body?.error || "Image upload failed");
          return;
        }
        setSuccessMsg("Image saved successfully!");
      } else {
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
        setSuccessMsg("Planet created successfully!");
      }
      // Refresh galaxies list to show any newly created galaxy
      await fetchGalaxies();
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function isDataUrl(value: string): boolean {
    return /^data:image\/(png|jpe?g);base64,/i.test(value.trim());
  }

  function isUrl(value: string): string | null {
    try {
      const u = new URL(value.trim());
      return u.href;
    } catch {
      return null;
    }
  }

  function isLikelyImageUrl(value: string): string | null {
    const url = isUrl(value);
    if (!url) return null;
    try {
      const u = new URL(url);
      const path = u.pathname.toLowerCase();
      if (path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg")) return url;
      const q = u.search.toLowerCase();
      if (q.includes("format=png") || q.includes("format=jpg") || q.includes("format=jpe") || q.includes("image")) return url;
      return null;
    } catch {
      return null;
    }
  }

  return (
    <>
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
        setSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
          // Decide whether this is an image categorization or text
          const asDataUrl = planet && isDataUrl(planet) ? planet : null;
          const asUrl = !asDataUrl && planet ? isLikelyImageUrl(planet) : null;

          const payload = asDataUrl
            ? { type: "image", data: { dataUrl: asDataUrl } }
            : asUrl
            ? { type: "image", data: { url: asUrl } }
            : { type: "text", data: { content: planet || "" } };

          const res = await fetch("/api/ai/pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            if (res.status === 401) {
              setErrorMsg("Please sign in to continue.");
            } else {
              setErrorMsg(body?.error || "AI pipeline failed");
            }
            return;
          }
          setSuccessMsg("Saved with AI! You can review it on your dashboard anytime.");
          await fetchGalaxies();
          if (onSuccess) onSuccess();
        } finally {
          setSubmitting(false);
        }
      }}
    />
    </>
  );
}

export default function PglPage() {
  return (
    <Suspense fallback={null}>
      <Homeer />
    </Suspense>
  );
}
