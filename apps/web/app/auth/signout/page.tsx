"use client"

import { signOut } from "next-auth/react"

export default function Outlog() {
    return (
        <button onClick={ () => signOut({ callbackUrl: "/"})}> Sign out </button>
    )
}