"use client";

import {
  ClipboardIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./dashboard.module.css";

interface PlanetItemProps {
  id: string;
  content: string;
  createdAt: Date;
  reasoning?: string | null;
  alternatives?: string[];
}

export function PlanetItem({ id, content, createdAt, reasoning, alternatives = [] }: PlanetItemProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number; align: "top" | "bottom" } | null>(null);
  const [isAttaching, setIsAttaching] = useState<string | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!infoRef.current) return;
      if (!infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
        setBubblePos(null);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Broadcast when the info bubble opens/closes so parent cards can pause hover effects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evtName = showInfo ? 'planet-info-open' : 'planet-info-close';
    window.dispatchEvent(new CustomEvent(evtName));
    return () => {
      // On unmount ensure we signal close
      window.dispatchEvent(new CustomEvent('planet-info-close'));
    };
  }, [showInfo]);

  // Position the bubble relative to the viewport so it is never clipped
  useEffect(() => {
    if (!showInfo) return;
    const btn = infoRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const bubbleWidth = 360; // approx max width
    const estimatedBubbleHeight = 200; // heuristic for placement decision
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal placement: stick to right edge of button when possible
    let x = Math.min(Math.max(rect.right - bubbleWidth, margin), vw - bubbleWidth - margin);

    // Vertical auto flip: prefer opening upward if there's enough space above
    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;
    const align: "top" | "bottom" = spaceAbove >= estimatedBubbleHeight + margin ? "top" : "bottom";

    setBubblePos({ x, y: 0, align }); // y is computed in style
  }, [showInfo]);

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
          updatedData: editContent.trim(),
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh the page to update the dashboard
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update planet: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update planet");
    } finally {
      setIsUpdating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  async function handleAttachToFolder(folderName: string) {
    if (!folderName) return;
    setIsAttaching(folderName);
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'attachPlanetToFolder', planetId: id, folderName }),
      });
      if (!res.ok) throw new Error('Failed to attach');
      // Close bubble and refresh to reflect the change
      setShowInfo(false);
      setBubblePos(null);
      window.location.reload();
    } catch (e) {
      // keep bubble open but clear loading
    } finally {
      setIsAttaching(null);
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
        <div className={styles.planetInfoWrap} ref={infoRef}>
          <button
            className={styles.copyBtn}
            aria-label="Show context"
            title={reasoning ? "Show context" : "no context"}
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo((v) => !v);
            }}
          >
            <InformationCircleIcon className={styles.infoIcon} />
          </button>
          {showInfo && bubblePos && typeof document !== 'undefined'
            ? ReactDOM.createPortal(
                <div className={styles.infoOverlay} style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
                  <div
                    className={styles.infoBubble}
                    role="dialog"
                    aria-label="Context"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'fixed',
                      left: `${bubblePos.x}px`,
                      ...(bubblePos.align === 'top' 
                        ? { bottom: `${window.innerHeight - (infoRef.current?.getBoundingClientRect().top ?? 0) + 12}px` }
                        : { top: `${(infoRef.current?.getBoundingClientRect().bottom ?? 0) + 12}px` }
                      ),
                    }}
                  >
                    <div className={styles.infoSection}>
                    <div className={styles.infoSectionTitle}>Reasoning</div>
                    <div className={styles.infoSectionBody}>
                      {reasoning ? reasoning : "no context"}
                    </div>
                    </div>
                    {alternatives && alternatives.length > 0 ? (
                      <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Alternative names</div>
                        <div className={styles.infoAltButtons}>
                          {alternatives.slice(0, 10).map((alt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={styles.altBtn}
                              title={alt}
                              disabled={isAttaching === alt}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAttachToFolder(alt);
                              }}
                            >
                              {isAttaching === alt ? 'Adding…' : alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>,
                document.body
              )
            : null}
        </div>
      </div>
    </div>
  );
}

export default PlanetItem;
