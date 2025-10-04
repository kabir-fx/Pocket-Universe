"use client";

import { FormEvent, useCallback, useState } from "react";
import styles from "./playground-card.module.css";
import {
  FolderIcon,
  SparklesIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export interface PlgCardProps {
  title?: string;
  subtitle?: string;
  submitting: boolean;
  errorMsg?: string | null;
  successMsg?: string | null;
  galaxies?: { id: string; name: string }[];
  backgroundColor?: string;
  cardBackgroundColor?: string;
  showShadows?: boolean;
  onSubmit: (args: {
    galaxy?: string;
    planet: string;
    imgDataUrl?: string;
    onSuccess?: () => void;
  }) => Promise<void> | void;
  onAiSubmit?: (args: {
    planet: string;
    onSuccess?: () => void;
  }) => Promise<void> | void;
}

export function PlgCard({
  title = "Playground",
  subtitle = "Create galaxies and planets to organize your thoughts",
  submitting = false,
  errorMsg,
  successMsg,
  galaxies = [],
  backgroundColor,
  cardBackgroundColor,
  showShadows = true,
  onSubmit,
  onAiSubmit,
}: PlgCardProps) {
  const [galaxy, setGalaxy] = useState("");
  const [planet, setPlanet] = useState("");
  const [isTypingGalaxy, setIsTypingGalaxy] = useState(false);
  const [showGalaxyDropdown, setShowGalaxyDropdown] = useState(false);
  const [newGalaxyName, setNewGalaxyName] = useState("");
  const [pastedImageDataUrl, setPastedImageDataUrl] = useState<string | null>(null);

  const clearForm = () => {
    setGalaxy("");
    setPlanet("");
    setPastedImageDataUrl(null);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({
      galaxy: galaxy || undefined,
      planet,
      imgDataUrl: pastedImageDataUrl || undefined,
      onSuccess: clearForm,
    });
  }

  async function handleAiClick() {
    if (!onAiSubmit) return;
    if (!planet) return;
    await onAiSubmit({
      planet,
      onSuccess: clearForm,
    });
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    try {
      const items = e.clipboardData?.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = async () => {
              const result = reader.result;
              if (typeof result === "string") {
                const optimized = await maybeDownscaleDataUrl(result, 1600, 0.85);
                setPastedImageDataUrl(optimized);
                // Clear any text content to reflect image mode
                setPlanet("");
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
      // If no image found, allow normal paste of text
    } catch {
      // ignore
    }
  }, []);

  const clearPastedImage = useCallback(() => setPastedImageDataUrl(null), []);

  async function maybeDownscaleDataUrl(dataUrl: string, maxDim: number, quality: number): Promise<string> {
    try {
      const img = new Image();
      const done: Promise<string> = new Promise((resolve) => {
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const dstW = Math.max(1, Math.round(w * scale));
          const dstH = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement("canvas");
          canvas.width = dstW;
          canvas.height = dstH;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0, dstW, dstH);
          const mime = dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";
          const out = canvas.toDataURL(mime, mime === "image/png" ? undefined : quality);
          resolve(out);
        };
        img.onerror = () => resolve(dataUrl);
      });
      img.src = dataUrl;
      return await done;
    } catch {
      return dataUrl;
    }
  }

  return (
    <div
      className={styles.container}
      style={backgroundColor ? { background: backgroundColor } : undefined}
    >
      <form
        onSubmit={handleSubmit}
        className={styles.cardWide}
        style={{
          ...(cardBackgroundColor ? { background: cardBackgroundColor } : {}),
          ...(showShadows ? {} : { boxShadow: "none" }),
        }}
      >
        {/* Decorative plus signs for bottom corners */}
        <div className={styles.plusBL}></div>
        <div className={styles.plusBR}></div>

        {/* Decorative edge lines with gaps around plus signs */}
        <div className={styles.lineBottomLeft}></div>
        <div className={styles.lineBottomCenter}></div>
        <div className={styles.lineBottomRight}></div>
        <div className={styles.lineLeftTop}></div>
        <div className={styles.lineLeftBottom}></div>
        <div className={styles.lineRightTop}></div>
        <div className={styles.lineRightBottom}></div>

        <div className={styles.headerRow}>
          <div style={{ paddingLeft: 4 }}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={styles.headerActions}></div>
        </div>

        {errorMsg ? <div className={styles.error}>{errorMsg}</div> : null}
        {successMsg ? <div className={styles.success}>{successMsg}</div> : null}

        <div className={styles.topControls}>
          <div className={styles.galaxyDropdown}>
            <button
              type="button"
              className={styles.addGalaxyBtn}
              onClick={() => setShowGalaxyDropdown(!showGalaxyDropdown)}
            >
              <FolderIcon className={styles.sidebarIcon} />
              {galaxy || "Add Folder"}
              <ChevronDownIcon className={styles.dropdownIcon} />
            </button>
            {showGalaxyDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  {isTypingGalaxy ? (
                    <div className={styles.headerInputWrap}>
                      <input
                        className={styles.headerInput}
                        placeholder="New Folder name"
                        value={newGalaxyName}
                        onChange={(e) => setNewGalaxyName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const committed = newGalaxyName.trim();
                            if (committed) {
                              setGalaxy(committed);
                            }
                            setShowGalaxyDropdown(false);
                            setIsTypingGalaxy(false);
                            setNewGalaxyName("");
                          }
                          if (e.key === "Escape") {
                            setIsTypingGalaxy(false);
                            setNewGalaxyName("");
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label="Create galaxy"
                      className={styles.headerAddButton}
                      onClick={() => {
                        setIsTypingGalaxy(true);
                        setNewGalaxyName("");
                      }}
                    >
                      <PlusIcon className={styles.plusIcon} />
                      <span className={styles.headerAddLabel}>Create</span>
                    </button>
                  )}
                </div>
                <div className={styles.galaxyList}>
                  {galaxies.length === 0 ? (
                    <div className={styles.empty}>No galaxies yet</div>
                  ) : (
                    galaxies.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`${styles.galaxyItem} ${galaxy === g.name ? styles.galaxyItemActive : ""}`}
                        onClick={() => {
                          setGalaxy(g.name);
                          setShowGalaxyDropdown(false);
                          setIsTypingGalaxy(false);
                        }}
                      >
                        {g.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            {pastedImageDataUrl ? (
              <div className={styles.previewWrap} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pastedImageDataUrl} alt="Pasted preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                <button type="button" onClick={clearPastedImage} className={styles.headerAddButton} aria-label="Remove image">
                  Remove
                </button>
              </div>
            ) : (
              <input
                id="planet"
                name="planet"
                type="text"
                className={styles.planetInput}
                placeholder="Paste your links, content, or image here..."
                value={planet}
                onChange={(e) => setPlanet(e.target.value)}
                onPaste={handlePaste}
                required
              />
            )}
            {onAiSubmit ? (
              <button
                type="button"
                disabled={submitting}
                className={styles.createButton}
                data-submitting={submitting}
                onClick={handleAiClick}
                aria-label="Save with AI"
                title="Save with AI"
              >
                Save with AI
              </button>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className={styles.createButton}
              data-submitting={submitting}
            >
              {submitting ? "Creating…" : "Create Planet"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
