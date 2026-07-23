import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * PER-DEVICE THEME ONLY.
 *
 * Theme mode (light/dark) and accent color chosen from the navbar are stored
 * ONLY in this browser's localStorage. They are NEVER written to the database,
 * so one visitor's choice can never affect any other visitor's website.
 * Global visual changes are only possible from Admin → Site Settings.
 *
 * Do not add DB writes here.
 */

type Theme = "light" | "dark";
type Accent = "blue" | "cyan" | "violet" | "emerald" | "rose" | "amber" | "orange" | "pink";

interface ThemeCtx {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setAccent: (a: Accent) => void;
}

const ACCENTS: Record<Accent, { primary: string; glow: string; accent: string; ring: string }> = {
  blue:    { primary: "217 91% 60%", glow: "199 89% 60%", accent: "199 89% 55%", ring: "217 91% 60%" },
  cyan:    { primary: "189 94% 55%", glow: "180 90% 60%", accent: "175 85% 50%", ring: "189 94% 55%" },
  violet:  { primary: "262 83% 65%", glow: "280 85% 65%", accent: "295 75% 60%", ring: "262 83% 65%" },
  emerald: { primary: "152 76% 50%", glow: "170 80% 55%", accent: "165 70% 50%", ring: "152 76% 50%" },
  rose:    { primary: "350 89% 60%", glow: "340 90% 65%", accent: "330 85% 60%", ring: "350 89% 60%" },
  amber:   { primary: "38 92% 55%",  glow: "45 95% 60%",  accent: "30 90% 55%",  ring: "38 92% 55%" },
  orange:  { primary: "20 90% 58%",  glow: "15 95% 62%",  accent: "10 88% 58%",  ring: "20 90% 58%" },
  pink:    { primary: "320 85% 62%", glow: "310 90% 67%", accent: "295 80% 62%", ring: "320 85% 62%" },
};

const Ctx = createContext<ThemeCtx | null>(null);

const safeGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* private mode / storage disabled */ }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => (safeGet("aiw-theme") as Theme) || "dark");
  const [accent, setAccentState] = useState<Accent>(() => (safeGet("aiw-accent") as Accent) || "blue");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    safeSet("aiw-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[accent];
    root.style.setProperty("--primary", a.primary);
    root.style.setProperty("--primary-glow", a.glow);
    root.style.setProperty("--accent", a.accent);
    root.style.setProperty("--ring", a.ring);
    safeSet("aiw-accent", accent);
  }, [accent]);

  return (
    <Ctx.Provider value={{
      theme, accent,
      toggleTheme: () => setTheme(t => t === "dark" ? "light" : "dark"),
      setAccent: setAccentState,
    }}>{children}</Ctx.Provider>
  );
};

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
};

export const ACCENT_LIST: Accent[] = ["blue", "cyan", "violet", "emerald", "rose", "amber", "orange", "pink"];
