import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PackageDetail from "@/components/details/PackageDetail";
import { getPackageById } from "@/services/packages.service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const pkg = await getPackageById(id);
  return { title: pkg ? pkg.title : "Package not found" };
}

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await getPackageById(id);
  if (!pkg) notFound();
  return <PackageDetail pkg={pkg} />;
}
