"use client";

import { Heart } from "lucide-react";
import { FavoriteItem, useApp } from "@/context/AppProvider";

interface FavoriteButtonProps {
  type: FavoriteItem["type"];
  id: string;
  label: string;
  className?: string;
}

export default function FavoriteButton({ type, id, label, className = "" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useApp();
  const active = isFavorite(type, id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(type, id);
      }}
      aria-pressed={active}
      aria-label={`${active ? "Remove" : "Save"} ${label} ${active ? "from" : "to"} favorites`}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${className}`}
    >
      <Heart size={17} className={active ? "fill-gold-500 text-gold-500" : "text-slate-600"} />
    </button>
  );
}
