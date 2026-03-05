"use client";

import { useEffect, useState } from "react";

type ReceiptImageProps = {
  receiptUrl: string | null;
};

export function ReceiptImage({ receiptUrl }: ReceiptImageProps) {
  const [showFull, setShowFull] = useState(false);
  const src = receiptUrl ?? null;

  useEffect(() => {
    if (!showFull) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowFull(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showFull]);

  if (!src) {
    return <p className="text-sm text-slate-400">لا يوجد إيصال مرفق</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFull(true)}
        className="group relative overflow-hidden rounded-xl border border-[var(--border)] transition hover:border-[var(--brand)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="إيصال التحويل"
          className="h-20 w-20 object-cover transition group-hover:scale-105"
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
            className="relative max-h-[90vh] max-w-3xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="إيصال التحويل - عرض كامل"
              className="rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowFull(false)}
              className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}
