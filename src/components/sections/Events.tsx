import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, ArrowRight, IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string | null;
  image_url: string | null;
  registration_open: boolean;
  fee_amount: number | null;
}

const fmt = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const Events = () => {
  const [items, setItems] = useState<Event[] | null>(null);

  useEffect(() => {
    supabase.from("events").select("*").order("event_date", { ascending: false })
      .then(({ data }) => setItems((data as Event[]) ?? []));
  }, []);

  return (
    <Section
      id="events"
      eyebrow="Events"
      title={<>Workshops, hackathons & <span className="text-gradient">talks</span></>}
      description="Browse what's happening and what we've already shipped together."
    >
      {items === null ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No events yet. Stay tuned — the AI Wings calendar is filling fast.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((e) => (
            <article key={e.id} className="group relative rounded-2xl overflow-hidden bg-gradient-card border border-border hover:border-primary/50 hover:shadow-glow transition-all hover:-translate-y-1 duration-500 flex flex-col">
              <Link to={`/event/${e.id}`} className="block">
                {e.image_url ? (
                  <div className="relative h-44 overflow-hidden">
                    <img src={e.image_url} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-primary relative overflow-hidden">
                    <div className="absolute inset-0 neural-grid opacity-30" />
                  </div>
                )}
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
                    <Calendar className="h-3 w-3" />
                    {fmt(e.event_date)}
                  </div>
                  {Number(e.fee_amount) > 0 ? (
                    <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <IndianRupee className="h-2.5 w-2.5" />{e.fee_amount}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">FREE</span>
                  )}
                </div>
                <Link to={`/event/${e.id}`}>
                  <h3 className="font-display font-semibold text-lg mb-2 hover:text-primary transition-colors">{e.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{e.description}</p>
                {e.venue && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin className="h-3 w-3" /> {e.venue}
                  </div>
                )}
                <div className="mt-auto">
                  {e.registration_open ? (
                    <Button asChild size="sm" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow group/btn">
                      <Link to={`/event/${e.id}`}>
                        View & Register <ArrowRight className="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to={`/event/${e.id}`}>View details</Link>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
};
