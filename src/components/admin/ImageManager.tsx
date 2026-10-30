"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Star, Trash2, Upload, ChevronLeft, ChevronRight, ImageOff, RefreshCw } from "lucide-react";
import { adminApi, ApiError, mediaUrl } from "@/lib/admin/api";
import { useAdminToast } from "@/lib/admin/toast";
import { Card, LoadingState } from "./ui";

export type MediaOwnerType = "DESTINATION" | "HOTEL" | "ROOM" | "TOUR" | "CAR_MODEL" | "TRANSFER_VEHICLE_CLASS" | "PACKAGE" | "SITE_BRANDING";

interface MediaItem {
  id: string;
  url: string;
  altText: string;
  isCover: boolean;
  sortOrder: number;
}

interface UploadTask {
  id: string;
  name: string;
  pct: number;
  error: string | null;
}

/** Full image management for one catalogue owner (a hotel, a room, a tour, a car model, a transfer
 *  vehicle class, a package, or a destination): multi-upload (click or drag-and-drop) with
 *  per-file progress, gallery grid, cover selection, reordering, in-place replace and deletion.
 *  Every owner type Media supports gets the exact same widget — this is the piece the brief calls
 *  out by name ("not just hotel image uploads"). */
export default function ImageManager({ ownerType, ownerId }: { ownerType: MediaOwnerType; ownerId: string }) {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  const load = useCallback(() => {
    adminApi
      .get<MediaItem[]>("/admin/media", { ownerType, ownerId })
      .then(setItems)
      .catch(() => setItems([]));
  }, [ownerType, ownerId]);

  useEffect(load, [load]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    const newTasks: UploadTask[] = list.map((f) => ({ id: `${f.name}-${f.lastModified}-${Math.random()}`, name: f.name, pct: 0, error: null }));
    setTasks((prev) => [...prev, ...newTasks]);

    let succeeded = 0;
    await Promise.all(
      list.map(async (file, i) => {
        const taskId = newTasks[i].id;
        const form = new FormData();
        form.append("ownerType", ownerType);
        form.append("ownerId", ownerId);
        form.append("altText", file.name.replace(/\.[^.]+$/, ""));
        form.append("file", file);
        try {
          await adminApi.uploadWithProgress("/admin/media", form, "POST", (pct) => {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, pct } : t)));
          });
          succeeded++;
          setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (err) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, error: err instanceof ApiError ? err.message : "Upload failed" } : t)));
        }
      }),
    );
    if (succeeded > 0) {
      notify("success", succeeded > 1 ? `${succeeded} images uploaded` : "Image uploaded");
      load();
    }
    const failed = list.length - succeeded;
    if (failed > 0) notify("error", failed > 1 ? `${failed} images failed to upload` : "An image failed to upload");
  }

  async function replaceFile(id: string, file: File) {
    if (!file.type.startsWith("image/")) return;
    setReplacingId(id);
    const form = new FormData();
    form.append("file", file);
    try {
      await adminApi.uploadWithProgress(`/admin/media/${id}/file`, form, "PATCH", () => {});
      notify("success", "Image replaced");
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to replace image");
    } finally {
      setReplacingId(null);
    }
  }

  async function setCover(id: string) {
    try {
      await adminApi.patch(`/admin/media/${id}`, { isCover: true });
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to set cover image");
    }
  }

  async function remove(id: string) {
    try {
      await adminApi.delete(`/admin/media/${id}`);
      notify("success", "Image deleted");
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to delete image");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!items) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    try {
      await Promise.all([adminApi.patch(`/admin/media/${a.id}`, { sortOrder: b.sortOrder }), adminApi.patch(`/admin/media/${b.id}`, { sortOrder: a.sortOrder })]);
      load();
    } catch (err) {
      notify("error", err instanceof ApiError ? err.message : "Failed to reorder images");
      load();
    }
  }

  if (items === null) return <LoadingState label="Loading images…" />;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) void uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <Upload size={22} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-700">{tasks.length > 0 ? "Uploading…" : "Drag and drop images here, or click to browse"}</p>
        <p className="text-xs text-slate-400">JPEG, PNG or WebP</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* A hidden input shared by every card's "Replace" button — replaceTargetRef (not state)
          carries which image it's for, since it must be known synchronously when the browser's
          file picker fires its change event. */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const targetId = replaceTargetRef.current;
          if (file && targetId) void replaceFile(targetId, file);
          e.target.value = "";
          replaceTargetRef.current = null;
        }}
      />

      {tasks.length > 0 && (
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate text-slate-500">{t.name}</span>
              {t.error ? (
                <span className="text-red-600">{t.error}</span>
              ) : (
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${t.pct}%` }} />
                </div>
              )}
              {!t.error && <span className="w-9 shrink-0 text-right text-slate-400">{t.pct}%</span>}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <ImageOff size={16} /> No images yet — the public site shows a placeholder until one is uploaded.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, i) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-video bg-slate-100">
                {/* Admin-only tool, not a published Artifact: a plain <img> against the backend's own
                    origin is fine — no next/image remote-pattern config needed for this view. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(item.url)} alt={item.altText} className="h-full w-full object-cover" />
                {item.isCover && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Star size={10} className="fill-white" /> Cover
                  </span>
                )}
                {replacingId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <RefreshCw size={18} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move earlier"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move later"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex gap-0.5">
                  {!item.isCover && (
                    <button type="button" onClick={() => setCover(item.id)} title="Set as cover" className="rounded p-1 text-slate-500 hover:bg-slate-100">
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={replacingId !== null}
                    onClick={() => {
                      replaceTargetRef.current = item.id;
                      replaceInputRef.current?.click();
                    }}
                    title="Replace image"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button type="button" onClick={() => remove(item.id)} title="Delete" className="rounded p-1 text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
