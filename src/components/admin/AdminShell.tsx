"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  LayoutDashboard,
  Hotel,
  BedDouble,
  Map,
  CalendarClock,
  Car,
  Bus,
  Package,
  MapPin,
  Navigation,
  ShieldCheck,
  CalendarCheck,
  Wallet,
  Settings,
  Percent,
  Palette,
  LogOut,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin/auth";
import { usePersistentState } from "@/lib/persistent";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/hotels", label: "Hotels", icon: Hotel },
  { href: "/admin/rooms", label: "Hotel Rooms", icon: BedDouble },
  { href: "/admin/tours", label: "Tours", icon: Map },
  { href: "/admin/tour-sessions", label: "Tour Sessions", icon: CalendarClock },
  { href: "/admin/cars", label: "Cars", icon: Car },
  { href: "/admin/transfers", label: "Transfers", icon: Bus },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/locations", label: "Locations", icon: Navigation },
  { href: "/admin/policies", label: "Policies", icon: ShieldCheck },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/pricing-rules", label: "Pricing & Fees", icon: Percent },
  { href: "/admin/settings/branding", label: "Branding", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function currentSection(pathname: string | null) {
  if (!pathname) return null;
  // Longest-prefix match so /admin/hotels/:id still resolves to the "Hotels" nav entry.
  return [...NAV].sort((a, b) => b.href.length - a.href.length).find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))) ?? null;
}

function Breadcrumbs({ pathname }: { pathname: string | null }) {
  const section = currentSection(pathname);
  if (!section) return null;
  const segments = (pathname ?? "").split("/").filter(Boolean);
  // ["admin", "hotels", ":id"] -> a 3rd segment means we're on a detail page below the section.
  const isDetail = segments.length > 2 && section.href !== "/admin";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
      <Link href="/admin" className="hover:text-slate-700">
        Dashboard
      </Link>
      {section.href !== "/admin" && (
        <>
          <span className="text-slate-300">/</span>
          <Link href={section.href} className={isDetail ? "hover:text-slate-700" : "font-medium text-slate-800"}>
            {section.label}
          </Link>
        </>
      )}
      {isDetail && (
        <>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">Details</span>
        </>
      )}
    </nav>
  );
}

function QuickSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ref = value.trim();
    if (!ref) return;
    router.push(`/admin/bookings?reference=${encodeURIComponent(ref)}`);
    setValue("");
  };

  return (
    <form onSubmit={submit} className="relative hidden w-full max-w-xs sm:block">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Find a booking by reference…"
        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </form>
  );
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
  const { user } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "A";

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100" aria-haspopup="menu" aria-expanded={open}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-slate-700 sm:inline">
          {user?.firstName} {user?.lastName}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{user?.email}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
            <button
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = usePersistentState<boolean>("eb_admin_sidebar_collapsed", false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href));

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const sidebar = (
    <nav className="flex h-full flex-col bg-brand-950 text-brand-100">
      <div className={`flex items-center gap-2 px-5 py-5 ${collapsed ? "justify-center px-0" : ""}`}>
        {!collapsed && (
          <>
            <span className="font-display text-lg font-semibold text-white">AHF Travel</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">Admin</span>
          </>
        )}
        {collapsed && <span className="font-display text-lg font-semibold text-white">AHF</span>}
      </div>
      <div className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center" : ""} ${
                active ? "bg-white/10 text-white" : "text-brand-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-white/10 px-3 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand-200 hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className={`hidden shrink-0 lg:fixed lg:inset-y-0 lg:flex ${collapsed ? "w-20" : "w-64"} transition-all`}>{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className={collapsed ? "lg:pl-20" : "lg:pl-64"}>
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <Breadcrumbs pathname={pathname} />
          <div className="flex-1" />
          <QuickSearch />
          <UserMenu onLogout={handleLogout} />
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
