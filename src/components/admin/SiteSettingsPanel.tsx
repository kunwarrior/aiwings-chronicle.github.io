import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageInput } from "@/components/admin/ImageInput";
import { Loader2, Save, Sparkles } from "lucide-react";
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

export const SiteSettingsPanel = ({ password }: { password: string }) => {
  const [rowId, setRowId] = useState<string | null>(null);
  const [effects, setEffects] = useState(true);
  const [bg, setBg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("id,value").eq("key", "hero").maybeSingle();
      if (data) {
        setRowId(data.id);
        const v = data.value as Partial<HeroValue>;
        setEffects(v.effects_enabled ?? true);
        setBg(v.background_image_url ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!rowId) return;
    setBusy(true);
    try {
      const value: HeroValue = {
        effects_enabled: effects,
        background_image_url: bg.trim() || null,
      };
      await call(password, {
        action: "update",
        table: "site_settings",
        id: rowId,
        payload: { value, updated_at: new Date().toISOString() },
      });
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
      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-6">
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" /> Hero section
          </div>
          <p className="text-sm text-muted-foreground">Control the front-page hero look. Changes go live immediately.</p>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/40">
          <div>
            <Label className="text-base">Animated effects</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Neural network animation, glowing orbs, rotating rings & parallax.
              Turn off for a calmer, lighter look.
            </p>
          </div>
          <Switch checked={effects} onCheckedChange={setEffects} />
        </div>

        <div className="space-y-2 p-4 rounded-xl border border-border bg-background/40">
          <Label className="text-base">Custom background image</Label>
          <p className="text-xs text-muted-foreground">
            Upload an image to replace the gradient/animated background. Leave empty to use the default.
          </p>
          <ImageInput label="Background" value={bg} onChange={setBg} />
          {bg && (
            <Button type="button" variant="outline" size="sm" onClick={() => setBg("")}>
              Remove background image
            </Button>
          )}
        </div>

        <Button onClick={save} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save settings</>}
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground space-y-3">
        <div className="font-display font-semibold text-foreground text-base">Tips</div>
        <ul className="space-y-2 list-disc pl-4">
          <li>To make a "Live now" popup appear on the home page, open the <strong className="text-foreground">Events</strong> tab and turn on <strong className="text-foreground">Live now</strong> for that event.</li>
          <li>Only one event should be marked live at a time — the most recent live event is shown.</li>
          <li>Background images look best at 1920×1080 or larger, in landscape orientation.</li>
          <li>Effects off + custom background = the cleanest, fastest experience for visitors.</li>
        </ul>
      </div>
    </div>
  );
};
