import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { images } from "@/data/images";
import type { Branding } from "@/services/branding.service";
import { hexToRgba } from "@/lib/color";

const DEFAULT_EYEBROW = "The land of the Pharaohs, planned your way";
const DEFAULT_TITLE = "Discover Egypt Your Way";
const DEFAULT_SUBTITLE = "Hotels, unforgettable experiences, private transfers and car rentals — all in one place.";
const DEFAULT_BUTTON_TEXT = "Explore Egypt";
const DEFAULT_BUTTON_HREF = "#booking-search";

const ALIGN_CLASS: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center mx-auto",
  right: "items-end text-right ms-auto",
};

export default function Hero({ branding }: { branding?: Branding } = {}) {
  const hero = branding?.hero ?? {};
  const imageSrc = hero.backgroundImageDesktop || images.hero;
  const align = ALIGN_CLASS[hero.textAlign ?? "left"] ?? ALIGN_CLASS.left;
  const overlay = hero.overlayColor ? hexToRgba(hero.overlayColor, hero.overlayOpacity ?? 0.5) : undefined;

  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden pt-28 pb-36 sm:min-h-[90vh] sm:pb-44">
      <Image src={imageSrc} alt="" fill priority sizes="100vw" className="object-cover" unoptimized={Boolean(hero.backgroundImageDesktop)} />
      {overlay ? <div className="absolute inset-0" style={{ backgroundColor: overlay }} /> : <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />}

      <div className="relative z-10 mx-auto w-full max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className={`flex max-w-2xl flex-col ${align}`}>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {DEFAULT_EYEBROW}
          </span>
          <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-balance text-white sm:text-5xl lg:text-6xl">
            {hero.title || DEFAULT_TITLE}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">{hero.subtitle || DEFAULT_SUBTITLE}</p>
          <div className="mt-8">
            <Button href={hero.buttonHref || DEFAULT_BUTTON_HREF} size="lg">
              {hero.buttonText || DEFAULT_BUTTON_TEXT}
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
