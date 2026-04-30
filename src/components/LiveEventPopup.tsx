import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Radio } from "lucide-react";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string | null;
  image_url: string | null;
}

export const LiveEventPopup = () => {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchLive = async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,description,event_date,venue,image_url")
        .eq("is_live", true)
        .order("event_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setEvent(data as LiveEvent);
        const dismissed = sessionStorage.getItem("aiw-live-dismissed");
        if (dismissed !== data.id) setOpen(true);
      } else {
        setEvent(null); setOpen(false);
      }
    };

    fetchLive();

    const channel = supabase
      .channel("events_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchLive())
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, []);

  const dismiss = () => {
    if (event) sessionStorage.setItem("aiw-live-dismissed", event.id);
    setOpen(false);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        {event.image_url && (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <div className="p-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-mono uppercase tracking-wider mb-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            <Radio className="h-3 w-3" /> Live now
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{event.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground pt-2">
              {event.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {new Date(event.event_date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            {event.venue && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> {event.venue}
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 gap-2 sm:gap-2">
            <Button variant="outline" onClick={dismiss}>Maybe later</Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <a href="#register" onClick={dismiss}>Join now</a>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
