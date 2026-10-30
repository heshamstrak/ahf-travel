"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 sm:aspect-[16/9]">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${alt}, photo ${active + 1} of ${count}`}
          fill
          priority={active === 0}
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 end-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {active + 1} / {count}
            </span>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl ring-2 transition ${
                i === active ? "ring-brand-600" : "ring-transparent hover:ring-slate-300"
              }`}
            >
              <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
