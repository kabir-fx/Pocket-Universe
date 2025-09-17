"use client";

import { ReactNode } from "react";
import styles from "./dashboard.module.css";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
  subtitle
}: DashboardLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.stack}>{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
