import type {Metadata} from "next";
import {Suspense} from "react";
import {Syne, Noto_Sans_SC, Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/layout/site-header";
import {RouteProgress, RouteProgressProvider} from "@/components/layout/route-progress";
import {SiteFooter} from "@/components/layout/site-footer";

const serif = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

const sans = Syne({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const sansCn = Noto_Sans_SC({
    subsets: ["latin"],
    weight: ["100", "400", "700"],
    variable: "--font-cn",
    display: "swap",
});

export const metadata: Metadata = {
    title: "SILENCE — Photography by Song",
    description: "A personal journal of light, cities, and people.",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="zh">
        <body className={`${serif.variable} ${sans.variable} ${sansCn.variable} font-sans`}>
        <RouteProgressProvider>
            <Suspense fallback={null}>
                <RouteProgress />
            </Suspense>
            <div aria-hidden="true" className="site-edge-accent site-edge-accent-top" />
            <div aria-hidden className="silence-glow pointer-events-none absolute inset-x-0 top-0 h-[800px]" />
            <SiteHeader />

            <main id="page-top" tabIndex={-1} className="relative z-10 outline-none">{children}</main>

            <SiteFooter year={new Date().getFullYear()} />
            <div aria-hidden="true" className="site-edge-accent site-edge-accent-bottom" />

        </RouteProgressProvider>
        </body>
        </html>
    );
}
