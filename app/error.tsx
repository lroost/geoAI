"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Ein Fehler ist aufgetreten.</p>
            <Button variant="outline" size="sm" onClick={reset}>
                Neu laden
            </Button>
        </div>
    )
}
