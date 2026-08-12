import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  autoPlayMs?: number;
  pauseMs?: number;
}

export function LeadersCarousel<T>({ items, renderItem, autoPlayMs = 4000, pauseMs = 8000 }: Props<T>) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout>>();

  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => (i + 1) % count);
    }, autoPlayMs);
    return () => clearInterval(id);
  }, [count, paused, autoPlayMs]);

  useEffect(() => () => clearTimeout(pauseTimer.current), []);

  const holdAutoplay = () => {
    setPaused(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), pauseMs);
  };

  const go = (dir: number) => {
    if (count < 2) return;
    holdAutoplay();
    setIndex((i) => (i + dir + count) % count);
  };

  if (count === 0) return null;

  return (
    <div className="w-full">
      <div
        className="overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, i) => (
            <div key={i} className="w-full shrink-0 px-0.5">
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous leader"
            className="h-10 w-10 rounded-full border border-border bg-card/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary active:scale-95 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to leader ${i + 1}`}
                aria-current={i === index}
                onClick={() => {
                  holdAutoplay();
                  setIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next leader"
            className="h-10 w-10 rounded-full border border-border bg-card/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary active:scale-95 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
