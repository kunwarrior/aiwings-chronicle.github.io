import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSettings {
  effects_enabled: boolean;
  background_image_url: string | null;
}

export interface BrandingSettings {
  hero_logo_url: string | null;
  dark_bg_color: string | null;   // HSL string like "224 47% 4%"
  dark_bg_color_2: string | null; // optional second color for gradient
  color_effects_enabled: boolean; // glowing orbs / colour bursts
}

const DEFAULT_HERO: HeroSettings = { effects_enabled: true, background_image_url: null };
const DEFAULT_BRANDING: BrandingSettings = {
  hero_logo_url: null,
  dark_bg_color: null,
  dark_bg_color_2: null,
  color_effects_enabled: true,
};

const useSettingRow = <T extends object>(key: string, defaults: T) => {
  const [settings, setSettings] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (active && data?.value) {
        setSettings({ ...defaults, ...(data.value as Partial<T>) });
      }
      if (active) setLoaded(true);
    })();

    const channel = supabase
      .channel(`site_settings_${key}_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload) => {
        const row = (payload.new ?? payload.old) as { key?: string; value?: Partial<T> } | null;
        if (row?.key === key && payload.new) {
          setSettings({ ...defaults, ...((payload.new as { value: Partial<T> }).value) });
        }
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { settings, loaded };
};

export const useHeroSettings = () => useSettingRow<HeroSettings>("hero", DEFAULT_HERO);
export const useBrandingSettings = () => useSettingRow<BrandingSettings>("branding", DEFAULT_BRANDING);
