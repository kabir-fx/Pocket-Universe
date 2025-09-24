"use client";

import { FolderIcon } from "@heroicons/react/24/outline";
import { PlanetItem } from "./planet-item";
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
  return (
    <div className={styles.card}>
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
