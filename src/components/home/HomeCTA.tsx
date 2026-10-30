import Button from "@/components/ui/Button";

export default function HomeCTA() {
  return (
    <section className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-6 py-16 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
        />

        <div className="relative">
          <h2 className="font-display text-3xl font-medium text-balance text-white sm:text-4xl">
            Ready to Explore Egypt?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-100">
            Discover hotels, experiences, cars and transfers for your next
            adventure.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="#booking-search" size="lg">
              Explore Egypt
            </Button>
            <Button href="/packages" size="lg" variant="ghost">
              View Travel Packages
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
