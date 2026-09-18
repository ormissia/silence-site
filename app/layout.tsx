import type {Metadata} from "next";
import {Suspense} from "react";
import {Syne, Noto_Sans_SC, Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/layout/site-header";
import {RouteProgress, RouteProgressProvider} from "@/components/layout/route-progress";
import {MobileGate} from "@/components/layout/mobile-gate";

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
            <SiteHeader />

            <main className="relative z-10">{children}</main>

            <footer className="relative z-10 bg-paper">
                <div
                    className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 pb-8 pt-5 font-sans text-caption leading-relaxed tracking-[0.06em] text-muted md:flex-row md:items-center md:justify-between md:px-10">
                    <span>© {new Date().getFullYear()} SILENCE <span className="mx-2 text-ink/20" aria-hidden>·</span> Photographs &amp; Notes by Song</span>
                    <div className="flex gap-6">
                        {/*<a href="#" className="hover:text-ink">Instagram</a>*/}
                        {/*<a href="#" className="hover:text-ink">VSCO</a>*/}
                        <a href="mailto:ormissia@outlook.com" className="transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">ormissia@outlook.com</a>
                    </div>
                </div>
            </footer>

            <MobileGate />
        </RouteProgressProvider>
        </body>
        </html>
    );
}
