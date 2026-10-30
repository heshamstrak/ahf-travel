import { serverGet } from "@/lib/api/server";
import { api } from "@/lib/api/client";
import type { Page, TransferRateView, VehicleClassView } from "@/lib/api/types";

export { getLocations } from "./locations.service";

export async function getVehicleClasses(): Promise<VehicleClassView[]> {
  const res = await serverGet<{ items: VehicleClassView[] }>("/transfers/vehicle-classes");
  return res.items;
}

/** Client-side: rates depend on the traveller's live route/date/passenger choices, fetched
 *  reactively from the booking form — never computed or cached client-side. */
export async function getTransferRates(params: {
  originLocationId: string;
  destinationLocationId: string;
  date?: string;
  time?: string;
  passengers?: number;
  luggage?: number;
}): Promise<TransferRateView[]> {
  const page = await api.get<Page<TransferRateView>>("/transfers/rates", { ...params, pageSize: 50 });
  return page.items;
}
