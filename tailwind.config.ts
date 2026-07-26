import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0A0A0B",
        ink: "#F2EEE6",
        muted: "#8A857C",
        rule: "#1F1E1C",
        accent: "#C8956B",
        "accent-end": "#8B5CF6",
        ember: "#7A1F12",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "var(--font-cn)", "ui-sans-serif", "system-ui"],
        hairline: ["var(--font-cn)", "var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        // DESIGN.md 四层字号体系
        // 层1: 最大标题 72px / 大标题 40px
        display: ["clamp(2.5rem, 7vw, 4.5rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        headline: ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        // 层2: 正文段落 15px / 说明 14px
        lede: ["1.0625rem", { lineHeight: "1.6" }],
        body: ["0.9375rem", { lineHeight: "1.7" }],
        deck: ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        // 层3: 按钮 13px / 标签 11px
        label: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        caption: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        // 层4: 注释 10px
        annotation: ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
      },
      letterSpacing: {
        eyebrow: "0.24em",
      },
      maxWidth: {
        prose: "62ch",
        column: "78ch",
      },
    },
  },
  plugins: [],
};

export default config;
