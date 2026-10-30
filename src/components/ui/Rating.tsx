import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  size?: number;
  className?: string;
}

export default function Rating({ value, size = 14, className = "" }: RatingProps) {
  const rounded = Math.round(value);

  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rounded ? "fill-gold-500 text-gold-500" : "fill-slate-200 text-slate-200"}
        />
      ))}
    </div>
  );
}
