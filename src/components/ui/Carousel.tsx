"use client";

import { Children, isValidElement, useCallback, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaCarouselType } from "embla-carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  children: ReactNode;
  ariaLabel: string;
}

function subscribeToEmbla(api: EmblaCarouselType | undefined, callback: () => void) {
  if (!api) return () => {};
  api.on("select", callback);
  api.on("reInit", callback);
  return () => {
    api.off("select", callback);
    api.off("reInit", callback);
  };
}

const alwaysFalse = () => false;

/**
 * Shared horizontal carousel for card showcases (hotels, tours, cars, packages,
 * destinations…). 4 cards on desktop (lg+), 3 on smaller desktop (md+), 2 on tablet (sm+),
 * 1 on mobile. Drag/swipe and trackpad scrolling come from Embla + its wheel-gestures plugin;
 * arrows and ArrowLeft/ArrowRight fire the same scroll API.
 *
 * Takes already-rendered cards as `children` rather than an items array + render function:
 * functions can't be passed from a Server Component into a Client Component, but JSX can.
 */
export default function Carousel({ children, ariaLabel }: CarouselProps) {
  const slides = Children.toArray(children);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" }, [
    WheelGesturesPlugin(),
  ]);

  const subscribe = useCallback((callback: () => void) => subscribeToEmbla(emblaApi, callback), [emblaApi]);
  const canScrollPrev = useSyncExternalStore(subscribe, () => emblaApi?.canScrollPrev() ?? false, alwaysFalse);
  const canScrollNext = useSyncExternalStore(subscribe, () => emblaApi?.canScrollNext() ?? false, alwaysFalse);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <div className="flex items-stretch -ml-5">
          {slides.map((slide, index) => (
            <div
              key={isValidElement(slide) && slide.key !== null ? slide.key : index}
              className="flex min-w-0 shrink-0 grow-0 basis-full pl-5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Previous items"
        className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Next items"
        className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
