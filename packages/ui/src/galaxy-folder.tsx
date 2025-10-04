"use client";

import { FolderIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { PlanetItem } from "./planet-item";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./dashboard.module.css";

interface Planet {
  id: string;
  content: string;
  createdAt: Date;
  reasoning?: string | null;
  alternatives?: string[];
}

interface GalaxyFolderProps {
  id: string;
  name: string;
  images?: { id: string; signedUrl: string | null; contentType: string; createdAt: string }[];
  planets: Planet[];
  planetCount: number;
  onEdit?: (id: string, currentName: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function GalaxyFolder({
  id,
  name,
  images = [],
  planets,
  planetCount,
  onEdit,
  onDelete,
}: GalaxyFolderProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showEditIcon, setShowEditIcon] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      prefersReducedMotionRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    }
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  function markCopied(id: string) {
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    setCopiedId(id);
    copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1000);
  }

  // Close lightbox on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxUrl(null);
    }
    if (lightboxUrl) {
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  // Pause tilt when any info bubble is open
  const tiltPausedRef = useRef<boolean>(false);
  useEffect(() => {
    function onOpen() {
      tiltPausedRef.current = true;
    }
    function onClose() {
      tiltPausedRef.current = false;
    }
    window.addEventListener("planet-info-open", onOpen as EventListener);
    window.addEventListener("planet-info-close", onClose as EventListener);
    return () => {
      window.removeEventListener("planet-info-open", onOpen as EventListener);
      window.removeEventListener("planet-info-close", onClose as EventListener);
    };
  }, []);

  function handleDelete() {
    if (
      confirm(
        `Are you sure you want to delete the folder "${name}" and move all planets to Orphaned Planets Folder?`,
      )
    ) {
      onDelete?.(id, name);
    }
  }

  function handleStartEditName() {
    setEditName(name);
    setIsEditingName(true);
    setShowEditIcon(false);
  }

  function handleSaveEditName() {
    if (editName.trim() === name.trim()) {
      setIsEditingName(false);
      return;
    }

    if (!editName.trim()) {
      alert("Folder name cannot be empty");
      return;
    }

    onEdit?.(id, editName.trim());
    setIsEditingName(false);
  }

  function handleCancelEditName() {
    setEditName(name);
    setIsEditingName(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEditName();
    } else if (e.key === "Escape") {
      handleCancelEditName();
    }
  }

  function setVars(
    rxDeg: number,
    ryDeg: number,
    tzPx: number,
    sweepXPercent: number,
    sweepYPercent: number,
  ) {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", `${rxDeg}deg`);
    el.style.setProperty("--ry", `${ryDeg}deg`);
    el.style.setProperty("--tz", `${tzPx}px`);
    el.style.setProperty("--sweepX", `${sweepXPercent}%`);
    el.style.setProperty("--sweepY", `${sweepYPercent}%`);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotionRef.current || tiltPausedRef.current) return;
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const normX = (localX / rect.width) * 2 - 1;
    const normY = (localY / rect.height) * 2 - 1;

    const targetRy = normX * 12;
    const targetRx = -normY * 12;
    const targetTz = (1 - Math.max(Math.abs(normX), Math.abs(normY))) * 18;

    const targetSweepX = -20 + normX * 80; // wider sweep range
    const targetSweepY = -16 + normY * 32;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      setVars(targetRx, targetRy, targetTz, targetSweepX, targetSweepY);
    });
  }

  function handleMouseLeave() {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    setVars(0, 0, 0, -30, -10);
  }

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.cardHeader}>
        <FolderIcon className={styles.icon} width={20} height={20} />
        <div className={styles.cardHeaderContent}>
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEditName}
              className={styles.folderNameInput}
              placeholder="New Folder name..."
              autoFocus
            />
          ) : (
            <div
              className={styles.cardTitle}
              onMouseEnter={() =>
                name !== "Orphaned Planets" && setShowEditIcon(true)
              }
              onMouseLeave={() => setShowEditIcon(false)}
            >
              {name}
              {showEditIcon && name !== "Orphaned Planets" && (
                <button
                  className={styles.folderEditIcon}
                  onClick={handleStartEditName}
                  title="Edit folder name"
                >
                  <PencilIcon width={12} height={12} />
                </button>
              )}
            </div>
          )}
          <div className={styles.cardMeta}>
            {planetCount + (images?.length || 0)} item{planetCount + (images?.length || 0) !== 1 ? "s" : ""}
          </div>
        </div>
        {name !== "Orphaned Planets" && (
          <button
            className={styles.folderDeleteBtn}
            title="Delete folder"
            onClick={handleDelete}
          >
            <TrashIcon
              className={styles.folderDeleteIcon}
              width={16}
              height={16}
            />
          </button>
        )}
      </div>

      <div className={styles.cardContent}>
        {images.length > 0 ? (
          <div className={styles.imageGrid}>
            {images.map((img) => (
              <div key={img.id} className={styles.imageItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.signedUrl || ""}
                  alt={name}
                  className={`${styles.imageThumb} ${deletingId === img.id ? styles.imageDeleting : ""}`}
                  onClick={() => img.signedUrl && setLightboxUrl(img.signedUrl)}
                />
                <button
                  className={styles.imageDeleteBtn}
                  title="Delete image"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      setDeletingId(img.id);
                      const res = await fetch("/api/dashboard", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type: "image", id: img.id }),
                      });
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        alert(body?.error || "Failed to delete image");
                        return;
                      }
                      // Refresh to reflect counts and cleanup
                      window.location.reload();
                    } catch (err) {
                      console.error("Failed to delete image:", err);
                      alert("Failed to delete image");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId === img.id}
                >
                  ×
                </button>
                <button
                  className={`${styles.imageCopyBtn} ${copiedId === img.id ? styles.imageCopyBtnOk : ""}`}
                  title="Copy image to clipboard"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      if (!img.signedUrl) {
                        alert("No image URL available to copy");
                        return;
                      }
                      const res = await fetch(img.signedUrl, { cache: "no-store" });
                      if (!res.ok) throw new Error("Failed to fetch image");
                      let blob = await res.blob();
                      const origMime = blob.type || img.contentType || "image/png";

                      const canWrite = Boolean((navigator as any)?.clipboard && (navigator.clipboard as any).write && (window as any).ClipboardItem);
                      const supportsType = (type: string) => {
                        const CI: any = (window as any).ClipboardItem;
                        return typeof CI?.supports === "function" ? CI.supports(type) : (type === "image/png");
                      };

                      if (canWrite) {
                        try {
                          if (supportsType(origMime)) {
                            const item = new (window as any).ClipboardItem({ [origMime]: blob });
                            await (navigator.clipboard as any).write([item]);
                            markCopied(img.id);
                            return;
                          }
                        } catch {}

                        // Convert to PNG if original type isn't supported for clipboard write (e.g., image/jpeg)
                        if (supportsType("image/png")) {
                          try {
                            const pngBlob = await (async () => {
                              const url = URL.createObjectURL(blob);
                              try {
                                const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                                  const im = new Image();
                                  im.onload = () => resolve(im);
                                  im.onerror = reject as any;
                                  im.crossOrigin = "anonymous";
                                  im.src = url;
                                });
                                const canvas = document.createElement("canvas");
                                canvas.width = image.naturalWidth || image.width;
                                canvas.height = image.naturalHeight || image.height;
                                const ctx = canvas.getContext("2d");
                                if (!ctx) throw new Error("Canvas 2D not available");
                                ctx.drawImage(image, 0, 0);
                                return await new Promise<Blob>((resolve, reject) =>
                                  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
                                );
                              } finally {
                                URL.revokeObjectURL(url);
                              }
                            })();
                            const item = new (window as any).ClipboardItem({ ["image/png"]: pngBlob });
                            await (navigator.clipboard as any).write([item]);
                            markCopied(img.id);
                            return;
                          } catch (err) {
                            console.warn("PNG fallback failed, copying URL instead", err);
                          }
                        }

                        // Final fallback: copy URL as text
                        await navigator.clipboard.writeText(img.signedUrl);
                        markCopied(img.id);
                        return;
                      }

                      // If programmatic image write is unavailable, fallback to copying URL
                      await navigator.clipboard.writeText(img.signedUrl);
                      markCopied(img.id);
                    } catch (err) {
                      console.error("Copy image failed:", err);
                      try {
                        if (img.signedUrl) {
                          await navigator.clipboard.writeText(img.signedUrl);
                          markCopied(img.id);
                        } else {
                          alert("Failed to copy image");
                        }
                      } catch {}
                    }
                  }}
                >
                  {copiedId === img.id ? "✓" : "⧉"}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {planets.length > 0 ? (
          <>
            {planets.map((planet) => (
              <PlanetItem
                key={planet.id}
                id={planet.id}
                content={planet.content}
                createdAt={planet.createdAt}
                reasoning={planet.reasoning ?? null}
                alternatives={planet.alternatives ?? []}
              />
            ))}
          </>
        ) : images.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <div className={styles.emptyText}>No items yet</div>
          </div>
        ) : null}
      </div>

      {lightboxUrl
        ? createPortal(
            <div className={styles.lightboxOverlay} onClick={() => setLightboxUrl(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt={name}
                className={styles.lightboxImg}
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default GalaxyFolder;
