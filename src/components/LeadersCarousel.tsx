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
      <div className="relative">
        <div
          className="overflow-hidden rounded-2xl"
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
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous leader"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-card/90 backdrop-blur border-2 border-primary/60 text-primary shadow-glow flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next leader"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-card/90 backdrop-blur border-2 border-primary/60 text-primary shadow-glow flex items-center justify-center active:scale-90 transition-all"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <>
          <div className="mt-4 flex items-center justify-center gap-3">
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
                  className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-primary shadow-glow" : "w-2.5 bg-primary/35"}`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              {index + 1} / {count}
            </span>
          </div>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            Swipe or tap the arrows to see more leaders
          </div>
        </>
      )}
    </div>
  );
}

