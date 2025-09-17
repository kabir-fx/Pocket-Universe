"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from "@heroicons/react/24/outline";
import { PlanetItem } from "./planet-item";
import styles from "./dashboard.module.css";

interface Planet {
  id: string;
  content: string;
  createdAt: Date;
}

interface GalaxyFolderProps {
  id: string;
  name: string;
  planets: Planet[];
  planetCount: number;
}

export function GalaxyFolder({ id, name, planets, planetCount }: GalaxyFolderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.card}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.cardHeader}>
        {isOpen ? (
          <ChevronDownIcon className={styles.icon} width={16} height={16} />
        ) : (
          <ChevronRightIcon className={styles.icon} width={16} height={16} />
        )}
        <FolderIcon className={styles.icon} width={18} height={18} />
        <div>
          <div className={styles.cardTitle}>{name}</div>
          <div className={styles.cardMeta}>{planetCount} planet{planetCount !== 1 ? 's' : ''}</div>
        </div>
      </button>

      {isOpen && (
        <div className={styles.divider}>
          {planets.length > 0 ? (
            <div>
              {planets.map((planet) => (
                <PlanetItem
                  key={planet.id}
                  id={planet.id}
                  content={planet.content}
                  createdAt={planet.createdAt}
                />
              ))}
            </div>
          ) : (
            <div className={styles.planetRow}>
              <div className={styles.dot}></div>
              <div className={styles.planetContent}>No planets in this galaxy yet</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GalaxyFolder;
