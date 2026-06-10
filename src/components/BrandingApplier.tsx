import { useEffect } from "react";
import { useBrandingSettings } from "@/hooks/useSiteSettings";

/**
 * Applies admin-controlled branding (custom background colors)
 * to CSS variables on <html>. Works in BOTH light and dark mode —
 * the same chosen colors apply regardless of theme so the site
 * looks consistent when the user switches.
 */
export const BrandingApplier = () => {
  const { settings } = useBrandingSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.dark_bg_color) {
      const c1 = settings.dark_bg_color;
      const c2 = settings.dark_bg_color_2 || c1;
      root.style.setProperty("--background", c1);
      root.style.setProperty(
        "--gradient-hero",
        `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.30), transparent 70%),
         radial-gradient(ellipse 60% 50% at 80% 80%, hsl(var(--accent) / 0.18), transparent 70%),
         linear-gradient(180deg, hsl(${c1}) 0%, hsl(${c2}) 100%)`,
      );
    } else {
      root.style.removeProperty("--background");
      root.style.removeProperty("--gradient-hero");
    }
  }, [settings.dark_bg_color, settings.dark_bg_color_2]);

  return null;
};
