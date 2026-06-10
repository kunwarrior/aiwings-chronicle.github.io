import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageInput } from "@/components/admin/ImageInput";
import { Loader2, Save, Sparkles, Palette, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

const call = async (password: string, body: Record<string, unknown>) => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": password,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
};

interface HeroValue {
  effects_enabled: boolean;
  background_image_url: string | null;
}

interface BrandingValue {
  hero_logo_url: string | null;
  dark_bg_color: string | null;
  dark_bg_color_2: string | null;
  color_effects_enabled: boolean;
}

const PRESETS: { label: string; bg: string; bg2: string }[] = [
  { label: "Neural Blue (default)", bg: "224 47% 4%", bg2: "222 50% 3%" },
  { label: "Midnight Violet", bg: "262 35% 6%", bg2: "270 40% 4%" },
  { label: "Deep Emerald", bg: "165 40% 5%", bg2: "170 45% 3%" },
  { label: "Carbon Black", bg: "0 0% 4%", bg2: "0 0% 2%" },
  { label: "Cyber Magenta", bg: "320 35% 6%", bg2: "310 40% 4%" },
  { label: "Sunset Crimson", bg: "0 35% 6%", bg2: "10 40% 4%" },
];

// HSL "H S% L%" <-> #hex helpers (so admins can use a normal colour picker)
const hslToHex = (hsl: string): string => {
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return "#000000";
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
};
const hexToHsl = (hex: string): string => {
  const m = hex.replace("#", "").match(/^([\da-f]{6})$/i);
  if (!m) return "0 0% 0%";
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  if (max !== min) {
    if (max === r) h = (g - b) / (max - min) + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const SiteSettingsPanel = ({ password }: { password: string }) => {
  // hero row
  const [heroId, setHeroId] = useState<string | null>(null);
  const [effects, setEffects] = useState(true);
  const [bg, setBg] = useState("");

  // branding row
  const [brandId, setBrandId] = useState<string | null>(null);
  const [heroLogo, setHeroLogo] = useState("");
  const [darkBg, setDarkBg] = useState("");   // hsl string
  const [darkBg2, setDarkBg2] = useState(""); // hsl string
  const [colorEffects, setColorEffects] = useState(true);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("id,key,value")
        .in("key", ["hero", "branding"]);
      (data ?? []).forEach((row) => {
        if (row.key === "hero") {
          setHeroId(row.id);
          const v = row.value as Partial<HeroValue>;
          setEffects(v.effects_enabled ?? true);
          setBg(v.background_image_url ?? "");
        } else if (row.key === "branding") {
          setBrandId(row.id);
          const v = row.value as Partial<BrandingValue>;
          setHeroLogo(v.hero_logo_url ?? "");
          setDarkBg(v.dark_bg_color ?? "");
          setDarkBg2(v.dark_bg_color_2 ?? "");
          setColorEffects(v.color_effects_enabled ?? true);
        }
      });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      if (heroId) {
        const value: HeroValue = {
          effects_enabled: effects,
          background_image_url: bg.trim() || null,
        };
        await call(password, {
          action: "update", table: "site_settings", id: heroId,
          payload: { value, updated_at: new Date().toISOString() },
        });
      }
      if (brandId) {
        const value: BrandingValue = {
          hero_logo_url: heroLogo.trim() || null,
          dark_bg_color: darkBg.trim() || null,
          dark_bg_color_2: darkBg2.trim() || null,
          color_effects_enabled: colorEffects,
        };
        await call(password, {
          action: "update", table: "site_settings", id: brandId,
          payload: { value, updated_at: new Date().toISOString() },
        });
      }
      toast.success("Settings saved — site updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground p-6"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Hero column */}
      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-5">
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" /> Hero section
          </div>
          <p className="text-sm text-muted-foreground">Front-page look & feel. Changes go live immediately.</p>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/40">
          <div>
            <Label className="text-base">Animated effects</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Neural network, parallax, rotating rings.
            </p>
          </div>
          <Switch checked={effects} onCheckedChange={setEffects} />
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/40">
          <div>
            <Label className="text-base">Color glow effects</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Glowing colored orbs in the background. Turn off for a flat look.
            </p>
          </div>
          <Switch checked={colorEffects} onCheckedChange={setColorEffects} />
        </div>

        <div className="space-y-2 p-4 rounded-xl border border-border bg-background/40">
          <Label className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Custom hero background image</Label>
          <p className="text-xs text-muted-foreground">Upload an image to replace the gradient background.</p>
          <ImageInput label="Background" value={bg} onChange={setBg} />
          {bg && (
            <Button type="button" variant="outline" size="sm" onClick={() => setBg("")}>Remove background</Button>
          )}
        </div>

        <div className="space-y-2 p-4 rounded-xl border border-border bg-background/40">
          <Label className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Floating hero logo</Label>
          <p className="text-xs text-muted-foreground">Replaces the central AI Wings logo. Use a transparent PNG for best results.</p>
          <ImageInput label="Hero logo" value={heroLogo} onChange={setHeroLogo} />
          {heroLogo && (
            <Button type="button" variant="outline" size="sm" onClick={() => setHeroLogo("")}>Reset to default logo</Button>
          )}
        </div>
      </div>

      {/* Branding / colors column */}
      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-5">
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
            <Palette className="h-4 w-4 text-primary" /> Site background colors
          </div>
          <p className="text-sm text-muted-foreground">Pick a preset or set your own colors. Applies to both light and dark mode.</p>
        </div>


        <div>
          <Label className="text-xs text-muted-foreground">Quick presets</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setDarkBg(p.bg); setDarkBg2(p.bg2); }}
                className="rounded-lg border border-border p-3 text-left hover:border-primary transition-colors"
                style={{ background: `linear-gradient(135deg, hsl(${p.bg}), hsl(${p.bg2}))` }}
              >
                <div className="text-xs font-medium text-white drop-shadow">{p.label}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setDarkBg(""); setDarkBg2(""); }}
              className="rounded-lg border border-dashed border-border p-3 text-left hover:border-primary transition-colors text-xs text-muted-foreground col-span-2"
            >
              Reset to default theme
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Top color</Label>
            <Input
              type="color"
              value={darkBg ? hslToHex(darkBg) : "#070b1a"}
              onChange={(e) => setDarkBg(hexToHsl(e.target.value))}
              className="h-10 p-1 cursor-pointer"
            />
            <p className="text-[10px] font-mono text-muted-foreground truncate">{darkBg || "default"}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bottom color</Label>
            <Input
              type="color"
              value={darkBg2 ? hslToHex(darkBg2) : "#050817"}
              onChange={(e) => setDarkBg2(hexToHsl(e.target.value))}
              className="h-10 p-1 cursor-pointer"
            />
            <p className="text-[10px] font-mono text-muted-foreground truncate">{darkBg2 || "default"}</p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> The accent color (blue/violet/etc.) is still controlled by the theme switcher in the navbar. This panel changes the page background in both light and dark mode.
        </div>

      </div>

      <div className="lg:col-span-2">
        <Button onClick={save} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save all settings</>}
        </Button>
      </div>
    </div>
  );
};
