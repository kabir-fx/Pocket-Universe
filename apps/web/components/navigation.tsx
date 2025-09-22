"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import { useSession, signOut } from "next-auth/react";
import styles from "./navigation.module.css";

const navigation = [
  // Home removed; brand link already routes to "/"
  { name: "Dashboard", href: "/dashboard", icon: FolderIcon },
  { name: "Playground", href: "/playground", icon: SparklesIcon },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.bar}>
          <div className={styles.left}>
            <Link href="/" className={styles.brand}>
              Universe
            </Link>
          </div>
          <div className={styles.right}>
            <div className={styles.links}>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                  >
                    <Icon className={styles.icon} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            {session ? (
              <>
                <details className={styles.menu}>
                  <summary className={styles.user}>
                    <UserIcon className={styles.icon} />
                    <span>{session.user?.name}</span>
                  </summary>
                  <div className={styles.dropdown}>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className={styles.dropdownItem}
                    >
                      Sign out
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className={styles.signin}>
                  Sign in
                </Link>
                <Link href="/auth/signup" className={styles.signup}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
