"use client"

import { FormEvent, useState } from "react";

export interface PlgCardProps {
    title?: string,
    submitting: boolean,
    errorMsg?: string | null,
    onSubmit: (args: { galaxy?: string, planet: string }) => Promise<void> | void;
}

export function PlgCard({ title = "Playground", submitting = false, errorMsg, onSubmit }: PlgCardProps) {
    const [galaxy, setGalaxy] = useState("");
    const [planet, setPlanet] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await onSubmit({ galaxy, planet });
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h1>{title}</h1>
                {errorMsg ? <div>{errorMsg}</div> : null}

                <label htmlFor="Galaxy">Galaxy</label>
                <input
                    id="galaxy"
                    name="Galaxy"
                    type="text"
                    value={galaxy}
                    onChange={(e) => setGalaxy(e.target.value)}
                    placeholder="Enter galaxy name"
                    required
                    autoComplete="galaxy"
                />

                <label htmlFor="Planet">Planet</label>
                <input
                    id="planet"
                    name="Planet"
                    type="text"
                    value={planet}
                    onChange={(e) => setPlanet(e.target.value)}
                    placeholder="Enter content"
                    required
                />

                <button type="submit" disabled={submitting} data-submitting={submitting}>
                    {submitting ? "Saving…" : "Save"}
                </button>
            </form>
        </div>
    )
}