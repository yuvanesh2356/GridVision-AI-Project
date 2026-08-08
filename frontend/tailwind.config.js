/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Content backgrounds
        void: "#F0F2F5",
        panel: "#FFFFFF",
        elevated: "#F8FAFC",
        "panel-border": "#E4E9F0",
        line: "#E4E9F0",

        // Sidebar (dark navy)
        sidebar: "#0F172A",
        "sidebar-hover": "#1E293B",
        "sidebar-active": "#1E3A5F",
        "sidebar-border": "#1E293B",
        "sidebar-muted": "#64748B",
        "sidebar-text": "#CBD5E1",

        // Typography
        "text-primary": "#0F172A",
        "text-secondary": "#374151",
        "text-muted": "#6B7280",
        "text-faint": "#9CA3AF",

        // Brand / interactive
        signal: "#2563EB",
        "signal-light": "#3B82F6",
        "signal-dim": "#1D4ED8",

        // Semantic severity
        healthy: "#16A34A",
        "healthy-bg": "#F0FDF4",
        "healthy-border": "#BBF7D0",

        medium: "#D97706",
        "medium-bg": "#FFFBEB",
        "medium-border": "#FDE68A",

        high: "#EA580C",
        "high-bg": "#FFF7ED",
        "high-border": "#FDBA74",

        critical: "#DC2626",
        "critical-bg": "#FEF2F2",
        "critical-border": "#FECACA",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        // Panels / cards
        card: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "card-md": "0 4px 12px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04)",
        "card-hover": "0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)",
        panel: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",

        // Signal glow
        glow: "0 0 0 1px rgba(37,99,235,0.25), 0 4px 16px -4px rgba(37,99,235,0.25)",
        "glow-sm": "0 0 0 1px rgba(37,99,235,0.20), 0 2px 8px -2px rgba(37,99,235,0.18)",

        // Sidebar inner
        "sidebar-item": "inset 0 0 0 1px rgba(255,255,255,0.04)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        card: "0.75rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        countUp: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        fadeIn: "fadeIn 0.35s ease-out both",
        slideInLeft: "slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1) both",
        scaleIn: "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
        scan: "scan 3s linear infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        pulse: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ping: "ping 1s cubic-bezier(0,0,0.2,1) infinite",
        toastIn: "toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
