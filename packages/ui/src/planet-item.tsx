"use client";

import { formatDistanceToNow } from "date-fns";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import styles from "./dashboard.module.css";

interface PlanetItemProps {
  content: string;
  createdAt: Date;
}

export function PlanetItem({ content, createdAt }: PlanetItemProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Silently ignore clipboard errors
    }
  }

  return (
    <div className={styles.planetRow}>
      <div className={styles.dot}></div>
      <div className={styles.planetContent}>{content}</div>
      <div className={styles.planetActions}>
        <button
          title="Copy to clipboard"
          aria-label="Copy planet content"
          className={styles.copyBtn}
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className={`${styles.copyIcon} ${styles.copyOk}`} />
          ) : (
            <ClipboardIcon className={styles.copyIcon} />
          )}
        </button>
        <div className={styles.planetTime}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

export default PlanetItem;
