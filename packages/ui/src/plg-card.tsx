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
  onSubmit,
}: PlgCardProps) {
  const [galaxy, setGalaxy] = useState("");
  const [planet, setPlanet] = useState("");

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
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {errorMsg ? <div className={styles.error}>{errorMsg}</div> : null}
        {successMsg ? <div className={styles.success}>{successMsg}</div> : null}

        <div className={styles.formGrid}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FolderIcon className="w-4 h-4" />
              Galaxy (Optional)
            </div>
            <label htmlFor="galaxy" className={styles.label}>
              Galaxy Name
            </label>
            <input
              id="galaxy"
              name="galaxy"
              type="text"
              value={galaxy}
              onChange={(e) => setGalaxy(e.target.value)}
              placeholder="e.g., Work, Personal, Ideas..."
              className={styles.input}
              autoComplete="galaxy"
            />
            <p className={styles.optional}>
              Leave empty to create a standalone planet
            </p>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <SparklesIcon className="w-4 h-4" />
              Planet
            </div>
            <label htmlFor="planet" className={styles.label}>
              Planet Content
            </label>
            <input
              id="planet"
              name="planet"
              type="text"
              value={planet}
              onChange={(e) => setPlanet(e.target.value)}
              placeholder="Enter your thought or idea..."
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttonSection}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.button}
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
