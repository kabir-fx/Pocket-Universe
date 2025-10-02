"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ClipboardIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import styles from "./dashboard.module.css";

interface PlanetItemProps {
  id: string;
  content: string;
  createdAt: Date;
}

export function PlanetItem({ id, content, createdAt }: PlanetItemProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);

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
        body: JSON.stringify({ type: "planet", id: id }),
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

  function handleStartEdit() {
    setEditContent(content);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setEditContent(content);
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    if (editContent.trim() === content.trim()) {
      setIsEditing(false);
      return;
    }

    if (!editContent.trim()) {
      alert("Content cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "planet",
          id: id,
          updatedData: editContent.trim()
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh the page to update the dashboard
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update planet: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update planet");
    } finally {
      setIsUpdating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }

  return (
    <div className={styles.planetRow}>
      <div className={styles.dot}></div>
      {isEditing ? (
        <div className={styles.planetContent}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.editInput}
            placeholder="Enter planet content..."
            disabled={isUpdating}
            autoFocus
          />
          <div className={styles.editActions}>
            <button
              onClick={handleSaveEdit}
              disabled={isUpdating || !editContent.trim()}
              className={styles.saveBtn}
              title="Save changes"
            >
              {isUpdating ? (
                <div className={styles.spinner}></div>
              ) : (
                <CheckIcon className={styles.saveIcon} />
              )}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className={styles.cancelBtn}
              title="Cancel editing"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.planetContent}>{content}</div>
      )}
      <div className={styles.planetActions}>
        {!isEditing && (
          <>
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
              title="Edit planet"
              aria-label="Edit planet"
              className={styles.editBtn}
              onClick={handleStartEdit}
            >
              <PencilIcon className={styles.editIcon} />
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
          </>
        )}
        <div className={styles.planetTime}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}

export default PlanetItem;
