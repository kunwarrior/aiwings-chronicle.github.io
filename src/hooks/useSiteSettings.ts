import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSettings {
  effects_enabled: boolean;
  background_image_url: string | null;
}

const DEFAULT: HeroSettings = { effects_enabled: true, background_image_url: null };

export const useHeroSettings = () => {
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero")
        .maybeSingle();
      if (active && data?.value) {
        setSettings({ ...DEFAULT, ...(data.value as Partial<HeroSettings>) });
      }
      if (active) setLoaded(true);
    })();

    const channel = supabase
      .channel("site_settings_hero")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload) => {
        const row = (payload.new ?? payload.old) as { key?: string; value?: Partial<HeroSettings> } | null;
        if (row?.key === "hero" && payload.new) {
          setSettings({ ...DEFAULT, ...((payload.new as { value: Partial<HeroSettings> }).value) });
        }
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  return { settings, loaded };
};
