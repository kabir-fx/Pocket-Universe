import Link from "next/link";
import {
  FolderIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import styles from "./home.module.css";

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.content}>
          <h1 className={styles.title}>Organize Your Universe</h1>
          <p className={styles.subtitle}>
            Create galaxies and planets to structure your thoughts, ideas, and
            projects in a beautiful, intuitive way.
          </p>
          <div className={styles.actions}>
            <Link href="/auth/signin" className={styles.primary}>
              <RocketLaunchIcon width={20} height={20} />
              Get Started
            </Link>
            <Link href="/playground" className={styles.secondary}>
              Try Playground
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Simple. Powerful. Organized.</h2>
          <p className={styles.featuresSubtitle}>
            Everything you need to organize your thoughts and ideas in one
            place.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <FolderIcon width={24} height={24} style={{ color: "white" }} />
              </div>
              <h3 className={styles.featureTitle}>Create Galaxies</h3>
              <p className={styles.featureDescription}>
                Group related thoughts and projects into galaxies. Perfect for
                organizing work, personal life, or creative projects.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <SparklesIcon
                  width={24}
                  height={24}
                  style={{ color: "white" }}
                />
              </div>
              <h3 className={styles.featureTitle}>Add Planets</h3>
              <p className={styles.featureDescription}>
                Capture individual thoughts, ideas, or tasks as planets within
                your galaxies. Each planet represents a unique piece of
                information.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <RocketLaunchIcon
                  width={24}
                  height={24}
                  style={{ color: "white" }}
                />
              </div>
              <h3 className={styles.featureTitle}>Stay Organized</h3>
              <p className={styles.featureDescription}>
                Access your organized universe from anywhere. Copy ideas
                instantly, view creation timestamps, and keep everything in
                sync.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
