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
  const [aiLimited, setAiLimited] = useState(false);

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
    (async () => {
      try {
        const res = await fetch("/api/playground/aiStatus", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = await res.json().catch(() => ({}));
        if (typeof body?.limited === "boolean") setAiLimited(body.limited);
      } catch {}
    })();
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
            img: asDataUrl ? { dataUrl: asDataUrl } : { url: asUrl },
          }),
        });

        const body = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          if (uploadRes.status === 415) {
            // Not an image; fallback to planet creation
            await createPlanet(planet, galaxy);

            // Refresh galaxies list to show any newly created galaxy
            await fetchGalaxies();
            if (onSuccess) onSuccess();
            return;
          }
          if (uploadRes.status === 401) {
            setErrorMsg("Please sign in to continue.");
            return;
          }
          if (uploadRes.status === 429) {
            setAiLimited(true);
            setErrorMsg(
              "AI daily limit reached. You can still add to a folder manually.",
            );
            return;
          }
          setErrorMsg(body?.message || body?.error || "Image upload failed");
          return;
        }
        setSuccessMsg("Image saved successfully!");
      } else {
        await createPlanet(planet, galaxy);
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
      if (
        path.endsWith(".png") ||
        path.endsWith(".jpg") ||
        path.endsWith(".jpeg")
      )
        return url;
      const q = u.search.toLowerCase();
      if (
        q.includes("format=png") ||
        q.includes("format=jpg") ||
        q.includes("format=jpe") ||
        q.includes("image")
      )
        return url;
      return null;
    } catch {
      return null;
    }
  }

  async function createPlanet(planet: string, galaxy?: string) {
    const planetRes = await fetch("/api/playground/planetCreate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "text",
        data: { content: planet || "" },
        ...(galaxy && galaxy.trim() ? { galaxy: galaxy.trim() } : {}),
      }),
    });

    if (planetRes.status === 429) {
      setAiLimited(true);
      setErrorMsg(
        "AI daily limit reached. You can still add to a folder manually.",
      );
      return;
    }
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

  async function handlePdfUpload({
    file,
    galaxy,
    onSuccess,
  }: {
    file: File;
    galaxy?: string;
    onSuccess?: () => void;
  }) {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Optional: pre-create/validate galaxy if provided
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

      const form = new FormData();
      form.append("file", file);
      if (galaxy && galaxy.trim()) form.append("galaxy", galaxy.trim());

      const res = await fetch("/api/playground/pdfStorage", {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setErrorMsg("Please sign in to continue.");
          return;
        }
        if (res.status === 429) {
          setAiLimited(true);
          setErrorMsg(
            "AI daily limit reached. You can still add to a folder manually.",
          );
          return;
        }
        setErrorMsg(body?.message || body?.error || "PDF upload failed");
        return;
      }
      setSuccessMsg("Document saved successfully!");
      await fetchGalaxies();
      if (onSuccess) onSuccess();
    } finally {
      setSubmitting(false);
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
        onAiSubmit={aiLimited ? undefined : handleSubmit}
        onPdfUpload={({ file, galaxy, onSuccess }) =>
          handlePdfUpload({ file, galaxy, onSuccess })
        }
        aiLimited={aiLimited}
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
