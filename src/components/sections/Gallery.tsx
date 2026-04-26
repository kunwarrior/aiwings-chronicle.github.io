import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Photo { id: string; title: string; image_url: string; caption: string | null; }

export const Gallery = () => {
  const [items, setItems] = useState<Photo[] | null>(null);
  useEffect(() => {
    supabase.from("gallery").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Photo[]) ?? []));
  }, []);

  return (
    <Section
      id="gallery"
      eyebrow="Gallery"
      title={<>Moments from <span className="text-gradient">the journey</span></>}
      description="Photos from our workshops, hackathons and meetups."
    >
      {items === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0,1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Photo wall is empty for now. Stay tuned!
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((p, i) => (
            <figure
              key={p.id}
              className={`group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all ${i % 5 === 0 ? "row-span-2" : ""}`}
            >
              <img src={p.image_url} alt={p.title} loading="lazy"
                className={`w-full ${i % 5 === 0 ? "h-full" : "aspect-square"} object-cover group-hover:scale-110 transition-transform duration-700`} />
              <figcaption className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div>
                  <div className="font-display font-semibold text-sm">{p.title}</div>
                  {p.caption && <div className="text-xs text-muted-foreground">{p.caption}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
};
