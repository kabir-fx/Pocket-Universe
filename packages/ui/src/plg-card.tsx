"use client";

import { FormEvent, useState } from "react";
import styles from "./playground-card.module.css";
import { FolderIcon, SparklesIcon } from "@heroicons/react/24/outline";

export interface PlgCardProps {
  title?: string;
  subtitle?: string;
  submitting: boolean;
  errorMsg?: string | null;
  successMsg?: string | null;
  galaxies?: { id: string; name: string }[];
  onSubmit: (args: {
    galaxy?: string;
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
  onSubmit,
}: PlgCardProps) {
  const [galaxy, setGalaxy] = useState("");
  const [planet, setPlanet] = useState("");
  const [isTypingGalaxy, setIsTypingGalaxy] = useState(false);

  const clearForm = () => {
    setGalaxy("");
    setPlanet("");
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({
      galaxy: galaxy || undefined,
      planet,
      onSuccess: clearForm,
    });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.cardWide}>
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

        <div className={styles.twoCol}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <FolderIcon className={styles.sidebarIcon} />
              <span>Recent Galaxies</span>
            </div>
            <div className={styles.galaxyList}>
              {galaxies.length === 0 ? (
                <div className={styles.empty}>No galaxies yet</div>
              ) : (
                galaxies.slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`${styles.galaxyItem} ${galaxy === g.name ? styles.galaxyItemActive : ""}`}
                    onClick={() => { setGalaxy(g.name); setIsTypingGalaxy(false); }}
                  >
                    {g.name}
                  </button>
                ))
              )}
            </div>
            <div className={styles.sidebarFooter}>
              {isTypingGalaxy ? (
                <input
                  className={styles.galaxyInput}
                  placeholder="New galaxy name"
                  value={galaxy}
                  onChange={(e) => setGalaxy(e.target.value)}
                />
              ) : (
                <button type="button" className={styles.addGalaxyBtn} onClick={() => setIsTypingGalaxy(true)}>+ New galaxy</button>
              )}
            </div>
          </aside>

          <section className={styles.pasteArea}>
            <label htmlFor="planet" className={styles.pasteLabel}>
              Paste
            </label>
            <textarea
              id="planet"
              name="planet"
              className={styles.pasteInput}
              placeholder="Paste your thought or idea here..."
              value={planet}
              onChange={(e) => setPlanet(e.target.value)}
              required
            />
            <div className={styles.pasteActions}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.button}
                data-submitting={submitting}
              >
                {submitting ? "Creating…" : "Create Planet"}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
