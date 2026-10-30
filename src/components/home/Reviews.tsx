import Image from "next/image";
import { Quote } from "lucide-react";
import { Review } from "@/data/types";
import Rating from "@/components/ui/Rating";
import SectionHeader from "@/components/ui/SectionHeader";

export default function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="bg-sand-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <SectionHeader align="center" eyebrow="Testimonials" title="What Travelers Say" />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <figure key={review.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <Quote className="text-brand-200" size={28} aria-hidden />
              <Rating value={review.rating} className="mt-4" />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{review.review}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image src={review.avatar} alt="" fill sizes="44px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">
                    {review.country} · {review.tripType}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
