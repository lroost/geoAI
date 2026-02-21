import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// Konfiguration für Inter (Fließtext)
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
})

const interDisplay = Inter({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
})

export const metadata: Metadata = {
    title: "geoAI - Lokales Geo-LLM",
    description: "Eine lokale Geo-LLM-Anwendung mit benutzerdefinierten Geodaten.",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="de"
            className={`${inter.variable} ${interDisplay.variable}`}
            suppressHydrationWarning
        >
            <body className={`${interDisplay.variable} antialiased font-sans`}>{children}</body>
        </html>
    )
}
