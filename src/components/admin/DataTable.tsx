"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { EmptyState, LoadingState, Pagination } from "./ui";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Renders the cell. Receives the row. */
  render: (row: T) => React.ReactNode;
  /** When set, the column header is sortable over this plain-value accessor. */
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | null;
  rowKey: (row: T) => string;
  /** Search box filters client-side over these accessors (catalogue lists are small; see report). */
  searchableText?: (row: T) => string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyHint?: string;
  /** Server-side pagination meta, when the caller's fetch is itself paginated. */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchableText,
  searchPlaceholder = "Search…",
  emptyTitle = "Nothing here yet",
  emptyHint,
  page,
  totalPages,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return null;
    let next = rows;
    if (searchableText && search.trim()) {
      const q = search.trim().toLowerCase();
      next = next.filter((r) => searchableText(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const sortValue = col?.sortValue;
      if (sortValue) {
        next = [...next].sort((a, b) => {
          const av = sortValue(a);
          const bv = sortValue(b);
          const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return next;
  }, [rows, search, sort, columns, searchableText]);

  const toggleSort = (key: string) => {
    setSort((cur) => (cur?.key === key ? (cur.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  };

  return (
    <div>
      {searchableText && (
        <div className="border-b border-slate-100 p-3">
          <div className="relative max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      )}

      {filtered === null ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title={emptyTitle} hint={emptyHint} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                    {col.sortValue ? (
                      <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {col.header}
                        {sort?.key === col.key ? sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : null}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={rowKey(row)} className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""} onClick={() => onRowClick?.(row)}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {page !== undefined && totalPages !== undefined && onPageChange && <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />}
    </div>
  );
}

/** Small round thumbnail cell, used in every catalogue table's first column. */
export function Thumbnail({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">No photo</div>
      )}
    </div>
  );
}
