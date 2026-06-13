import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 电影暗调：纸=深邃黑、墨=暖白；命名沿用避免改组件
        paper: "#0A0A0B",
        ink: "#F2EEE6",
        muted: "#8A857C",
        rule: "#1F1E1C",
        accent: "#C8956B",
        ember: "#7A1F12",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        // hairline：超细字重的中英组合，比 PingFang Ultralight 更纤细
        hairline: ["var(--font-sans-hairline)", "var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        // 杂志感语义化字号 token
        deck: ["0.875rem", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        body: ["1.0625rem", { lineHeight: "1.7" }],
        lede: ["1.375rem", { lineHeight: "1.55" }],
        headline: ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        display: ["clamp(3rem, 9vw, 8rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
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
