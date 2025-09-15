"use client";

import { useState, type FormEvent } from "react";
import styles from "./auth-card.module.css";

export interface AuthCardProps {
  title?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: { username: string; password: string }) => Promise<void> | void;
}

export function AuthCard({ title = "Sign in", submitting = false, errorMessage, onSubmit }: AuthCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ username, password });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

        <label htmlFor="username" className={styles.label}>Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          placeholder="Enter username"
          required
          autoComplete="username"
        />

        <label htmlFor="password" className={styles.label}>Password</label>
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

        <button type="submit" disabled={submitting} className={styles.button} data-submitting={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default AuthCard;


