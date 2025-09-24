import styles from "./home.module.css";
import Image from "next/image";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Media banner */}
      <section className={styles.bannerWrap}>
        <div className={styles.containerWide}>
          <div className={styles.banner}>
            {/* Use Next.js Image for responsive, non-cropping behavior */}
            <Image
              src="/landscape.png"
              alt="Hero landscape"
              className={styles.bannerImg}
              fill
              priority
              sizes="(max-width: 900px) 92vw, 1120px"
            />
          </div>
        </div>
      </section>

      {/* Two-column hero with headline and CTA */}
      <section className={styles.landing}>
        <div className={styles.containerWide}>
          <div className={styles.grid}>
            <div className={styles.leftCol}>
              <h1 className={styles.headline}>
                Save it once, find
                <br />
                it <em>always</em>
              </h1>
              <div className={styles.usedBy}>
                <span>Made with the following Tech Stack</span>
                <div className={styles.logosRow}>
                  <img src="/typescript.png" alt="TypeScript" />
                  <img src="/react.png" alt="React" />
                  <img src="/next.svg" alt="Next.js" />
                  <img src="/supabase.svg" alt="Supabase" />
                  <img src="/postgres.svg" alt="Postgres" />
                  <img src="/gcp.png" alt="Postgres" />
                </div>
              </div>
            </div>
            <div className={styles.rightCol}>
              <p className={styles.supporting}>
                Keep everything you save - connected, organized, and easy to
                access notes.
              </p>
              <form
                className={styles.emailForm}
                action="/auth/signup"
                method="get"
              >
                <input
                  className={styles.emailInput}
                  name="email"
                  placeholder="Enter your email"
                  aria-label="Email"
                />
                <button type="submit" className={styles.ctaButton}>
                  Try for free
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Soft glow footer section */}
      <section className={styles.glowFooter} aria-hidden="true" />
    </div>
  );
}
