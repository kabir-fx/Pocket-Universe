"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ClipboardIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import styles from "./dashboard.module.css";

interface PlanetItemProps {
  content: string;
  createdAt: Date;
}

export function PlanetItem({ content, createdAt }: PlanetItemProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Silently ignore clipboard errors
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this planet?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/dashboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        // Refresh the page to update the dashboard
        window.location.reload();
      } else {
        alert("Failed to delete planet");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete planet");
    } finally {
      setIsDeleting(false);
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
        <button
          title="Delete planet"
          aria-label="Delete planet"
          className={styles.deleteBtn}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <TrashIcon
            className={`${styles.deleteIcon} ${isDeleting ? styles.deleting : ""}`}
          />
        </button>
        <div className={styles.planetTime}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

export default PlanetItem;
