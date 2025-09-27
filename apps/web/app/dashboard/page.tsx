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
        const response = await fetch("/api/dashboard", {
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
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className={styles.notice}>
            <span className={styles.noticeText}>{error}</span>
            <a
              href="/auth/signin"
              style={{ marginLeft: 10, textDecoration: "underline" }}
            >
              Sign in
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (galaxies.length === 0) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className={styles.notice}>
            <span className={styles.noticeText}>
              No galaxies yet. Try the Playground to create your first.
            </span>
            <a
              href="/playground"
              style={{ marginLeft: 10, textDecoration: "underline" }}
            >
              Open Playground
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {galaxies.map((galaxy) => (
        <GalaxyFolder
          key={galaxy.id}
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
