"use client";

import { useState, type FormEvent } from "react";
import styles from "./auth-card.module.css";

export interface AuthCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: { email: string; password: string }) => Promise<void> | void;
  footer?: React.ReactNode;
}

export function AuthCard({
  title = "Sign in",
  subtitle,
  submitting = false,
  errorMessage,
  onSubmit,
  footer,
}: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {errorMessage ? (
          <div className={styles.error}>{errorMessage}</div>
        ) : null}

        <label htmlFor="email" className={styles.label}>
          Username
        </label>
        <input
          id="email"
          name="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="Enter email"
          required
          autoComplete="email"
        />

        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="Enter password"
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className={styles.button}
          data-submitting={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <div className={styles.footer}>{footer}</div>
      </form>
    </div>
  );
}

export default AuthCard;
