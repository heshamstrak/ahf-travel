import Image from "next/image";
import { Briefcase, Check, Users } from "lucide-react";
import { TransferVehicle } from "@/data/types";
import Button from "@/components/ui/Button";
import PriceDisplay from "@/components/ui/PriceDisplay";

interface TransferVehicleCardProps {
  vehicle: TransferVehicle;
  selected: boolean;
  onSelect: () => void;
  priceEGP: number;
  passengerWarning?: boolean;
}

export default function TransferVehicleCard({ vehicle, selected, onSelect, priceEGP, passengerWarning }: TransferVehicleCardProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all sm:flex-row ${
        selected ? "border-brand-600 ring-2 ring-brand-600/30" : "border-slate-100 hover:shadow-md"
      }`}
    >
      <div className="relative h-44 shrink-0 bg-sand-50 sm:h-auto sm:w-52">
        <Image src={vehicle.image} alt={vehicle.name} fill sizes="(min-width: 640px) 208px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">{vehicle.type}</span>
            <h3 className="font-display text-lg font-medium text-slate-900">{vehicle.name}</h3>
          </div>
          <PriceDisplay amountEGP={priceEGP} className="shrink-0 font-display text-lg font-semibold text-slate-900" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {vehicle.passengers} passengers
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase size={14} /> {vehicle.luggage} bags
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-1 text-sm text-slate-600 sm:grid-cols-2">
          {vehicle.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <Check size={14} className="shrink-0 text-brand-600" />
              {f}
            </li>
          ))}
        </ul>
        {passengerWarning ? (
          <p className="text-xs text-red-600">Too many passengers for this vehicle.</p>
        ) : null}
        <div className="mt-auto pt-2">
          <Button variant={selected ? "secondary" : "primary"} size="sm" onClick={onSelect} disabled={passengerWarning}>
            {selected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>
    </div>
  );
}
