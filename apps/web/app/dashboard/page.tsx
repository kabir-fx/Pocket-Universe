"use client";

import { Suspense, useEffect, useState } from "react";
import { DashboardLayout } from "@repo/ui/dashboard-layout";
import { GalaxyFolder } from "@repo/ui/galaxy-folder";
import styles from "./dashboard.module.css";

interface Planet {
  id: string;
  content: string;
  createdAt: Date;
}

interface Galaxy {
  id: string;
  name: string;
  planets: Planet[];
  _count: { planets: number };
}

function Dashboard() {
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/fetchPlanets", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401) {
            setError("Sign in to continue");
            return;
          }

          setError(body?.error ?? "Request failed");
          return;
        }

        setGalaxies(body);
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner}></div>
          <span className={styles.loadingText}>Loading your galaxies...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-2">Error</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  if (galaxies.length === 0) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Your galaxies and planets">
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-gray-400 mb-4">
            No galaxies found. Create your first galaxy in the playground!
          </div>
          <a
            href="/playground"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Playground
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Your galaxies and planets">
      {galaxies.map((galaxy) => (
        <GalaxyFolder
          key={galaxy.id}
          id={galaxy.id}
          name={galaxy.name}
          planets={galaxy.planets}
          planetCount={galaxy._count.planets}
        />
      ))}
    </DashboardLayout>
  );
}

export default function RealDash() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className={styles.loadingWrap}>
            <div className={styles.spinner}></div>
            <span className={styles.loadingText}>Loading...</span>
          </div>
        </DashboardLayout>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
