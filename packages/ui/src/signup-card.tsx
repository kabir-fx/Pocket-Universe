"use client";

import { useState, type FormEvent } from "react";
import styles from "./auth-card.module.css";

export interface SignupCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: {
    username: string;
    password: string;
    email: string;
  }) => Promise<void> | void;
  submitLabel?: string;
}

export interface SigninCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: {
    username: string;
    password: string;
  }) => Promise<void> | void;
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
      {/* Left Section - Form */}
      <div className={styles.leftSection}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <a href="/">pocket universe</a>
          </div>
          <h1 className={styles.title}>
            Save it once, find
            <br />
            it <em>always</em>
          </h1>
          {errorMessage ? (
            <div className={styles.error}>{errorMessage}</div>
          ) : null}

          {/* Social Login Buttons */}
          <div className={styles.socialRow}>
            <button type="button" className={styles.socialButton}>
              <svg className={styles.socialIcon} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            <button type="button" className={styles.socialButton}>
              <svg className={styles.socialIcon} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
                />
                <path
                  fill="currentColor"
                  d="M15.53 3.83c.893-1.09 1.477-2.602 1.306-4.089-1.265.056-2.847.875-3.758 1.944-.806.942-1.526 2.486-1.34 3.938 1.421.106 2.88-.717 3.792-1.793z"
                />
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className={styles.divider}>OR</div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
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

            <label htmlFor="username" className={styles.label}>
              Username
            </label>
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
              placeholder="Create a password"
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className={styles.button}
              data-submitting={submitting}
            >
              {submitting ? "Creating…" : submitLabel}
            </button>
          </form>

          <div className={styles.loginRow}>
            Already have an account? <a href="/auth/signin">Log in</a>
          </div>
        </div>
      </div>

      {/* Right Section - Hero Image */}
      <div className={styles.rightSection}>
        <div className={styles.heroOverlay}>
          <p className={styles.heroSubtitle}>Made with 💛 by Shivam</p>
        </div>
      </div>
    </div>
  );
}

export function SigninCard({
  title = "Welcome back",
  subtitle,
  submitting = false,
  errorMessage,
  onSubmit,
  submitLabel = "Sign in",
}: SigninCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ username, password });
  }

  return (
    <div className={styles.container}>
      {/* Left Section - Form */}
      <div className={styles.leftSection}>
        <div className={styles.card}>
          <div className={styles.brand}>
            <a href="/">pocket universe</a>
          </div>
          <h1 className={styles.title}>
            Save it once, find
            <br />
            it <em>always</em>
          </h1>
          {errorMessage ? (
            <div className={styles.error}>{errorMessage}</div>
          ) : null}

          {/* Social Login Buttons */}
          <div className={styles.socialRow}>
            <button type="button" className={styles.socialButton}>
              <svg className={styles.socialIcon} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            <button type="button" className={styles.socialButton}>
              <svg className={styles.socialIcon} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
                />
                <path
                  fill="currentColor"
                  d="M15.53 3.83c.893-1.09 1.477-2.602 1.306-4.089-1.265.056-2.847.875-3.758 1.944-.806.942-1.526 2.486-1.34 3.938 1.421.106 2.88-.717 3.792-1.793z"
                />
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className={styles.divider}>OR</div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
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
              {submitting ? "Signing in…" : submitLabel}
            </button>
          </form>

          <div className={styles.loginRow}>
            Don&apos;t have an account? <a href="/auth/signup">Sign up</a>
          </div>
        </div>
      </div>

      {/* Right Section - Hero Image */}
      <div className={styles.rightSection}>
        <div className={styles.heroOverlay}>
          <p className={styles.heroSubtitle}>Made with 💛 by Shivam</p>
        </div>
      </div>
    </div>
  );
}

export default SignupCard;
