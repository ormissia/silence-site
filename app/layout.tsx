import type {Metadata} from "next";
import {Suspense} from "react";
import {Inter, Noto_Sans_SC, Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/layout/site-header";
import {RouteProgress, RouteProgressProvider} from "@/components/layout/route-progress";
import {MobileGate} from "@/components/layout/mobile-gate";

const serif = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

const sans = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

// 中文超细字重——给"寂静无声"一类的大标题用，PingFang Ultralight 还嫌粗时回落到 Noto Sans SC 100
const sansHairline = Noto_Sans_SC({
    subsets: ["latin"],
    weight: ["100"],
    variable: "--font-sans-hairline",
    display: "swap",
});

export const metadata: Metadata = {
    title: "SILENCE — Photography by Song",
    description: "A personal journal of light, cities, and people.",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="zh">
        <body className={`${serif.variable} ${sans.variable} ${sansHairline.variable} font-sans`}>
        <RouteProgressProvider>
            <Suspense fallback={null}>
                <RouteProgress />
            </Suspense>
            <SiteHeader />

            <main className="relative z-10">{children}</main>

            <footer className="relative z-10 border-t border-rule">
                <div
                    className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-10 font-sans text-sm text-muted md:flex-row md:items-center md:justify-between md:px-10">
                    <span className="eyebrow">© {new Date().getFullYear()} SILENCE — Photographs &amp; Notes by Song</span>
                    <div className="flex gap-6 uppercase tracking-[0.18em]">
                        {/*<a href="#" className="hover:text-ink">Instagram</a>*/}
                        {/*<a href="#" className="hover:text-ink">VSCO</a>*/}
                        <a href="mailto:ormissia@outlook.com" className="hover:text-ink">ormissia@outlook.com</a>
                    </div>
                </div>
            </footer>

            <MobileGate />
        </RouteProgressProvider>
        </body>
        </html>
    );
}
