"use client"

import { Suspense, useEffect, useState } from "react";

function Dashboard() {
    const [res, setRes] = useState("Empty");

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/api/dashboard/fetchPlanets", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store"
            });

            const body = await response.json().catch(() => null);

            if (!response.ok) {
                if (response.status === 401) {
                    setRes(`Sign in to continue`);
                    return;
                }

                setRes((body?.error ?? "Request failed").toString());
                return;
            }

            setRes(typeof body === "string" ? body : JSON.stringify(body));
        };

        fetchData();
    }, []);

    return (
        <div>
            {res}
        </div>
    );
}

export default function RealDash() {
    return (
        <Suspense fallback={null}>
            <Dashboard />
        </Suspense>
    )
}