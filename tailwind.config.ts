import type { Config } from "tailwindcss";

// Design tokens ported from the approved Direction B ("Console") prototype
// (Design_Spec.md, prototype_B_console.html) — the shared type/spacing scale
// plus Direction B's warm-charcoal/amber/teal palette.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#1C1A17",
        panel: "#26231F",
        "panel-2": "#302C27",
        line: "#3E3A34",
        text: "#EDE8DF",
        "text-soft": "#A9A297",
        amber: { DEFAULT: "#E2A23B", dark: "#B87F26" },
        teal: "#4FB6A8",
      },
      spacing: {
        "4.5": "18px",
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "h1-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["19px", { lineHeight: "1.3", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
