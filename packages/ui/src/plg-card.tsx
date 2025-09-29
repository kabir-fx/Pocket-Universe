"use client";

import { FormEvent, useState } from "react";
import styles from "./playground-card.module.css";
import { FolderIcon, SparklesIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";

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
}: PlgCardProps) {
  const [galaxy, setGalaxy] = useState("");
  const [planet, setPlanet] = useState("");
  const [isTypingGalaxy, setIsTypingGalaxy] = useState(false);
  const [showGalaxyDropdown, setShowGalaxyDropdown] = useState(false);
  const [newGalaxyName, setNewGalaxyName] = useState("");

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
    <div
      className={styles.container}
      style={backgroundColor ? { background: backgroundColor } : undefined}
    >
      <form
        onSubmit={handleSubmit}
        className={styles.cardWide}
        style={{
          ...(cardBackgroundColor ? { background: cardBackgroundColor } : {}),
          ...(showShadows ? {} : { boxShadow: 'none' }),
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
              {galaxy || "Add Galaxy"}
              <ChevronDownIcon className={styles.dropdownIcon} />
            </button>
            {showGalaxyDropdown && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  {isTypingGalaxy ? (
                    <div className={styles.headerInputWrap}>
                      <input
                        className={styles.headerInput}
                        placeholder="New galaxy name"
                        value={newGalaxyName}
                        onChange={(e) => setNewGalaxyName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const committed = newGalaxyName.trim();
                            if (committed) {
                              setGalaxy(committed);
                            }
                            setShowGalaxyDropdown(false);
                            setIsTypingGalaxy(false);
                            setNewGalaxyName("");
                          }
                          if (e.key === 'Escape') {
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
            <input
              id="planet"
              name="planet"
              type="text"
              className={styles.planetInput}
              placeholder="Enter your thought or idea here..."
              value={planet}
              onChange={(e) => setPlanet(e.target.value)}
              required
            />
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
