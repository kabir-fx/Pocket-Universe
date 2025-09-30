"use client";

import { FolderIcon } from "@heroicons/react/24/outline";
import { PlanetItem } from "./planet-item";
import { useEffect, useRef } from "react";
import styles from "./dashboard.module.css";

interface Planet {
  id: string;
  content: string;
  createdAt: Date;
}

interface GalaxyFolderProps {
  name: string;
  planets: Planet[];
  planetCount: number;
}

export function GalaxyFolder({
  name,
  planets,
  planetCount,
}: GalaxyFolderProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);

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
    if (prefersReducedMotionRef.current) return;
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
          <div className={styles.cardTitle}>{name}</div>
          <div className={styles.cardMeta}>
            {planetCount} planet{planetCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className={styles.cardContent}>
        {planets.length > 0 ? (
          <>
            {planets.map((planet) => (
              <PlanetItem
                key={planet.id}
                content={planet.content}
                createdAt={planet.createdAt}
              />
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <div className={styles.emptyText}>No planets yet</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GalaxyFolder;
