"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    gap: "1rem",
                    fontFamily: "sans-serif",
                    padding: "1.5rem",
                    textAlign: "center",
                }}
            >
                <h2>Something went wrong!</h2>
                <p>{error.message}</p>
                <button onClick={reset}>Try again</button>
            </body>
        </html>
    );
}
