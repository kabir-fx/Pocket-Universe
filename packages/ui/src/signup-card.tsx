"use client";

import { useState, type FormEvent } from "react";
import styles from "./auth-card.module.css";

export interface SignupCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: {
    name: string;
    password: string;
    email: string;
  }) => Promise<void> | void;
  submitLabel?: string;
  onGithubClick?: () => void;
  onGoogleClick?: () => void;
}

export interface SigninCardProps {
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (args: { email: string; password: string }) => Promise<void> | void;
  submitLabel?: string;
  onGithubClick?: () => void;
  onGoogleClick?: () => void;
}

export function SignupCard({
  title = "Create your account",
  subtitle,
  submitting = false,
  errorMessage,
  onSubmit,
  submitLabel = "Sign up",
  onGithubClick,
  onGoogleClick,
}: SignupCardProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ name, password, email });
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
            <button
              type="button"
              className={styles.socialButton}
              onClick={onGoogleClick}
            >
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
            <button
              type="button"
              className={styles.socialButton}
              onClick={onGithubClick}
            >
              <svg
                className={styles.socialIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.54 0-.27-.01-1.15-.02-2.08-3.05.66-3.7-1.29-3.7-1.29-.5-1.28-1.22-1.63-1.22-1.63-.99-.67.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.97 1.66 2.55 1.18 3.17.9.1-.7.38-1.18.69-1.45-2.43-.28-4.99-1.22-4.99-5.44 0-1.2.43-2.17 1.14-2.94-.12-.28-.5-1.4.11-2.91 0 0 .95-.3 3.11 1.12.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.16-1.42 3.11-1.12 3.11-1.12.61 1.51.23 2.63.11 2.91.71.77 1.14 1.74 1.14 2.94 0 4.23-2.57 5.15-5.01 5.42.39.34.74 1.01.74 2.03 0 1.47-.01 2.65-.01 3.01 0 .3.2.65.76.54 4.35-1.46 7.5-5.57 7.5-10.43C23.02 5.24 18.27.5 12 .5z"
                />
              </svg>
              Continue with GitHub
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
              placeholder="Enter your email account"
              required
              autoComplete="email"
            />

            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter your name"
              required
              autoComplete="name"
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
  onGithubClick,
  onGoogleClick,
}: SigninCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ email, password });
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
            <button
              type="button"
              className={styles.socialButton}
              onClick={onGoogleClick}
            >
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
            <button
              type="button"
              className={styles.socialButton}
              onClick={onGithubClick}
            >
              <svg
                className={styles.socialIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.54 0-.27-.01-1.15-.02-2.08-3.05.66-3.7-1.29-3.7-1.29-.5-1.28-1.22-1.63-1.22-1.63-.99-.67.08-.66.08-.66 1.1.08 1.67 1.13 1.67 1.13.97 1.66 2.55 1.18 3.17.9.1-.7.38-1.18.69-1.45-2.43-.28-4.99-1.22-4.99-5.44 0-1.2.43-2.17 1.14-2.94-.12-.28-.5-1.4.11-2.91 0 0 .95-.3 3.11 1.12.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.16-1.42 3.11-1.12 3.11-1.12.61 1.51.23 2.63.11 2.91.71.77 1.14 1.74 1.14 2.94 0 4.23-2.57 5.15-5.01 5.42.39.34.74 1.01.74 2.03 0 1.47-.01 2.65-.01 3.01 0 .3.2.65.76.54 4.35-1.46 7.5-5.57 7.5-10.43C23.02 5.24 18.27.5 12 .5z"
                />
              </svg>
              Continue with GitHub
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
