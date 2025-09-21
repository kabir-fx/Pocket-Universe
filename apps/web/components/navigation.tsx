"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    HomeIcon,
    FolderIcon,
    SparklesIcon,
    ArrowRightOnRectangleIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { useSession, signOut } from "next-auth/react";
import styles from "./navigation.module.css";

const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
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
                        <Link href="/" className={styles.brand}>Universe</Link>
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
                    </div>
                    <div className={styles.right}>
                        {session ? (
                            <>
                                <div className={styles.user}>
                                    <UserIcon className={styles.icon} />
                                    <span>{session.user?.name}</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className={styles.signout}
                                >
                                    <ArrowRightOnRectangleIcon className={styles.icon} />
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/signin" className={styles.signin}>Sign in</Link>
                                <Link href="/auth/signup" className={styles.signup}>Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;
