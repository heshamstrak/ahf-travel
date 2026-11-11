import { Destination } from "@/data/types";
import { serverGet } from "@/lib/api/server";
import type { DestinationSummary, Page } from "@/lib/api/types";
import { FALLBACK_IMAGE } from "@/lib/api/images";

function toDestination(d: DestinationSummary): Destination {
  const count = d.productCounts.hotels + d.productCounts.tours + d.productCounts.packages;
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    country: d.countryCode,
    image: d.image?.url ?? FALLBACK_IMAGE,
    listingsCount: count,
    listingsLabel: count === 1 ? "1 listing" : `${count} listings`,
    featured: d.isFeatured,
  };
}

export async function getDestinations(): Promise<Destination[]> {
  const page = await serverGet<Page<DestinationSummary>>("/destinations", { pageSize: 50 });
  return page.items.map(toDestination);
}
