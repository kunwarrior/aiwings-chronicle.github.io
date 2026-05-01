import { useEffect } from "react";
import { useBrandingSettings } from "@/hooks/useSiteSettings";

/**
 * Applies admin-controlled branding (custom dark-mode background colors)
 * to CSS variables on <html>. Renders nothing.
 */
export const BrandingApplier = () => {
  const { settings } = useBrandingSettings();

  useEffect(() => {
    const root = document.documentElement;
    // Only override in dark mode — light mode keeps its clean defaults.
    const isDark = root.classList.contains("dark");
    if (isDark && settings.dark_bg_color) {
      root.style.setProperty("--background", settings.dark_bg_color);
      const c2 = settings.dark_bg_color_2 || settings.dark_bg_color;
      root.style.setProperty(
        "--gradient-hero",
        `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.30), transparent 70%),
         radial-gradient(ellipse 60% 50% at 80% 80%, hsl(var(--accent) / 0.18), transparent 70%),
         linear-gradient(180deg, hsl(${settings.dark_bg_color}) 0%, hsl(${c2}) 100%)`
      );
    } else {
      // clear overrides so default theme applies
      root.style.removeProperty("--background");
      root.style.removeProperty("--gradient-hero");
    }
  }, [settings.dark_bg_color, settings.dark_bg_color_2]);

  return null;
};
