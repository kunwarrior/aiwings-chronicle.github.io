import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Section = ({ id, eyebrow, title, description, children, className }: Props) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <section id={id} className={cn("py-24 md:py-32 relative", className)}>
      <div className="container-x">
        <div ref={ref} className="scroll-fade max-w-3xl mb-12 md:mb-16">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
              <span className="h-px w-8 bg-primary" />
              {eyebrow}
            </div>
          )}
          <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-5">{title}</h2>
          {description && <p className="text-lg text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
};
