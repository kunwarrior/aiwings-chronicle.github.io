import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Cloud, CloudOff, RefreshCw, Wrench } from "lucide-react";
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

type CloudStatus = { status: "active" | "unhealthy" | "paused" | "unknown"; latencyMs?: number };

interface MaintenanceValue {
  enabled: boolean;
  message: string;
}

interface SiteSettingRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
}

export const CloudControlPanel = ({ password }: { password: string }) => {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [waking, setWaking] = useState(false);

  const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const data = await call(password, { action: "cloud-status" });
      setStatus(data);
    } catch (e) {
      setStatus({ status: "unhealthy" });
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  };

  const wakeBackend = async () => {
    setWaking(true);
    try {
      await call(password, { action: "wake" });
      toast.success("Backend warmed up");
      await fetchStatus();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setWaking(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await call(password, { action: "list", table: "site_settings" });
      const rows = Array.isArray(res.data) ? res.data : [];
      const row = rows.find((r: SiteSettingRow) => r.key === "maintenance");
      if (row) {
        setMaintenanceId(row.id);
        const v = (row.value ?? {}) as Partial<MaintenanceValue>;
        setMaintenance(v.enabled ?? false);
        setMessage(v.message ?? "");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveMaintenance = async () => {
    if (!maintenanceId) {
      toast.error("Maintenance setting not found. Refresh and try again.");
      return;
    }
    setSaving(true);
    try {
      const value: MaintenanceValue = {
        enabled: maintenance,
        message: message.trim(),
      };
      await call(password, {
        action: "update",
        table: "site_settings",
        id: maintenanceId,
        payload: { value, updated_at: new Date().toISOString() },
      });
      toast.success(maintenance ? "Maintenance mode enabled" : "Maintenance mode disabled");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = () => {
    if (!status) return { label: "Checking…", icon: Loader2, className: "text-muted-foreground" };
    switch (status.status) {
      case "active":
        return { label: `Active · ${status.latencyMs ?? 0}ms`, icon: Cloud, className: "text-primary" };
      case "paused":
        return { label: "Paused / waking up", icon: CloudOff, className: "text-muted-foreground" };
      case "unhealthy":
      default:
        return { label: "Unreachable", icon: CloudOff, className: "text-destructive" };
    }
  };

  const badge = statusBadge();
  const Icon = badge.icon;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cloud settings…
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-5">
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
            <Cloud className="h-4 w-4 text-primary" /> Backend status
          </div>
          <p className="text-sm text-muted-foreground">
            See if the hosted backend is awake or sleeping. Free plans auto-pause after inactivity.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background/40">
          <Icon className={`h-5 w-5 ${badge.className} ${checking ? "animate-spin" : ""}`} />
          <div className="flex-1">
            <div className={`font-medium ${badge.className}`}>{badge.label}</div>
            <div className="text-xs text-muted-foreground">
              {status?.status === "paused"
                ? "The backend is waking up. First load may take a few seconds."
                : "A healthy backend responds quickly to requests."}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={checking}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${checking ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Button onClick={wakeBackend} disabled={waking} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {waking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-2" /> Wake backend now</>}
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-5">
        <div>
          <div className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
            <Wrench className="h-4 w-4 text-primary" /> Maintenance mode
          </div>
          <p className="text-sm text-muted-foreground">
            Block public visitors with a maintenance message. Admin login stays available.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background/40">
          <div>
            <Label className="text-base">Enable maintenance mode</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Only /admin and password reset remain reachable.
            </p>
          </div>
          <Switch checked={maintenance} onCheckedChange={setMaintenance} />
        </div>

        <div className="space-y-2 p-4 rounded-xl border border-border bg-background/40">
          <Label>Maintenance message (optional)</Label>
          <Input
            placeholder="We'll be back soon."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Shown to visitors when maintenance mode is on.</p>
        </div>

        <Button onClick={saveMaintenance} disabled={saving} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save maintenance setting"}
        </Button>
      </div>
    </div>
  );
};
