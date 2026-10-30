import Image from "next/image";
import { Clock, PlaneLanding, ShieldCheck, Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import { images } from "@/data/images";

const benefits = [
  { icon: Wallet, label: "Fixed prices" },
  { icon: ShieldCheck, label: "Professional drivers" },
  { icon: PlaneLanding, label: "Flight tracking" },
  { icon: Clock, label: "24/7 availability" },
];

export default function TransferBanner() {
  return (
    <section className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-12 sm:py-16 lg:py-20">
            <h2 className="font-display text-3xl font-medium text-balance text-white sm:text-4xl">
              Start Your Trip Without the Stress
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-brand-100">
              Book reliable private airport transfers before you arrive.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
              {benefits.map((benefit) => (
                <li key={benefit.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold-300">
                    <benefit.icon size={17} />
                  </span>
                  <span className="text-sm font-medium text-white">{benefit.label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Button href="/transfers" size="lg">
                Book Airport Transfer
              </Button>
            </div>
          </div>

          <div className="relative min-h-[280px] lg:min-h-full">
            <Image
              src={images.transferBanner}
              alt="Private airport transfer vans parked for guests"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/50 to-transparent lg:bg-gradient-to-l" />
          </div>
        </div>
      </div>
    </section>
  );
}
