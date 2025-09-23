import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Media banner */}
      <section className={styles.bannerWrap}>
        <div className={styles.containerWide}>
          <div className={styles.banner}>
            {/* Use any large marketing image here; placeholder uses window.svg */}
            <img src="/landscape.png" alt="Hero landscape" className={styles.bannerImg} />
          </div>
        </div>
      </section>

      {/* Two-column hero with headline and CTA */}
      <section className={styles.landing}>
        <div className={styles.containerWide}>
          <div className={styles.grid}>
            <div className={styles.leftCol}>
              <h1 className={styles.headline}>
                Say it once, watch AI agents do it <em>forever</em>
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
                Automate notes, planning, support, and repetitive tasks without writing a line of code.
              </p>
              <form className={styles.emailForm} action="/auth/signup" method="get">
                <input className={styles.emailInput} name="email" placeholder="Enter your email" aria-label="Email" />
                <button type="submit" className={styles.ctaButton}>Try for free</button>
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
