"use client";

import { useState, type FormEvent } from "react";
import styles from "./auth-card.module.css";

export interface SignupCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: { username: string; password: string; email: string }) => Promise<void> | void;
  submitLabel?: string;
}

export function SignupCard({
  title = "Create your account",
  subtitle,
  submitting = false,
  errorMessage,
  onSubmit,
  submitLabel = "Sign up",
}: SignupCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ username, password, email });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="Enter email"
          required
          autoComplete="email"
        />

        <label htmlFor="username" className={styles.label}>Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          placeholder="Choose a username"
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
          placeholder="Create a password"
          required
          autoComplete="new-password"
        />

        <button type="submit" disabled={submitting} className={styles.button} data-submitting={submitting}>
          {submitting ? "Creating…" : submitLabel}
        </button>
      </form>
    </div>
  );
}

export default SignupCard;


