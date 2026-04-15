"use client";

import { useEffect, useState } from "react";

type AirportRequestDocumentProps = {
  url: string | null;
  label: string;
};

export function AirportRequestDocument({ url, label }: AirportRequestDocumentProps) {
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (!showFull) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowFull(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showFull]);

  if (!url) {
    return <p className="text-sm text-slate-400">لا يوجد مرفق</p>;
  }

  const isPdf = url.split("?")[0].toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
      >
        فتح {label} (PDF)
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFull(true)}
        className="group relative block overflow-hidden rounded-xl border border-[var(--border)] transition hover:border-[var(--brand)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-40 w-full object-cover transition group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs">عرض كامل</span>
        </span>
      </button>

      {showFull && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowFull(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${label} - عرض كامل`} className="rounded-xl" />
            <button
              type="button"
              onClick={() => setShowFull(false)}
              className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}
