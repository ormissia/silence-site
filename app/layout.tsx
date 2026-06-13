import type {Metadata} from "next";
import {Inter, Playfair_Display} from "next/font/google";
import "./globals.css";
import {SiteHeader} from "@/components/layout/site-header";

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

export const metadata: Metadata = {
    title: "SILENCE — Photography by Song",
    description: "A personal journal of light, cities, and people.",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="zh">
        <body className={`${serif.variable} ${sans.variable} font-sans`}>
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
        </body>
        </html>
    );
}
