import { serverGet } from "@/lib/api/server";
import type { LocationRef, Page } from "@/lib/api/types";

export interface LocationSearchParams {
  type?: "AIRPORT" | "CAR_BRANCH" | "ZONE";
  destination?: string;
}

/** The backend caps pageSize at 50 (MAX_PAGE_SIZE) for every paginated list endpoint. */
export async function getLocations(params: LocationSearchParams = {}): Promise<LocationRef[]> {
  const page = await serverGet<Page<LocationRef>>("/locations", { ...params, pageSize: 50 });
  return page.items;
}
