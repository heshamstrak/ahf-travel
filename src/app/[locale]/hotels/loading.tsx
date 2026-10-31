import { ListingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-8xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <ListingSkeleton />
    </div>
  );
}
