import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MaintenanceValue {
  enabled: boolean;
  message?: string;
}

export const MaintenanceGuard = () => {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "maintenance")
          .single();
        const value = (data?.value ?? {}) as Partial<MaintenanceValue>;
        setMaintenance(value.enabled ?? false);
        setMessage(value.message?.trim() || "We'll be back soon.");
      } catch {
        setMaintenance(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (maintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
          <Loader2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-5xl mb-4">Under maintenance</h1>
        <p className="text-muted-foreground text-lg max-w-md">{message}</p>
      </div>
    );
  }

  return <Outlet />;
};
