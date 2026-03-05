"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useCallback, useState } from "react";

type Ad = {
  id: string;
  title: string;
  price: number | null;
  sort_order: number;
  status: string;
  ownerName: string | null;
  ownerPhone: string | null;
};

type Tab = "tanazul" | "taqib";

type Props = {
  tanazulAds: Ad[];
  taqibAds: Ad[];
};

function SortableItem({ ad }: { ad: Ad }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ad.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-medium text-slate-800">{ad.title}</span>
          {(ad.ownerName || ad.ownerPhone) && (
            <div className="flex items-center gap-2 mt-0.5">
              {ad.ownerName && (
                <span className="text-xs text-slate-500">{ad.ownerName}</span>
              )}
              {ad.ownerPhone && (
                <span dir="ltr" className="text-xs text-slate-400">{ad.ownerPhone}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ad.price != null && (
            <span className="text-xs text-slate-500">{ad.price.toLocaleString("ar-SA")} ر.س</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              ad.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {ad.status === "active" ? "نشط" : "محجوب"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdReorderClient({ tanazulAds, taqibAds }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("tanazul");
  const [tanazul, setTanazul] = useState(tanazulAds);
  const [taqib, setTaqib] = useState(taqibAds);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);

  const currentAds = activeTab === "tanazul" ? tanazul : taqib;
  const setCurrentAds = activeTab === "tanazul" ? setTanazul : setTaqib;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCurrentAds((ads) => {
      const oldIndex = ads.findIndex((a) => a.id === active.id);
      const newIndex = ads.findIndex((a) => a.id === over.id);
      return arrayMove(ads, oldIndex, newIndex);
    });
    setDirty(true);
  }

  const showToast = useCallback((message: string, ok: boolean) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const ads = activeTab === "tanazul" ? tanazul : taqib;
      const adIds = ads.map((a) => a.id);
      const newOrders = ads.map((_, i) => i + 1);

      const res = await fetch("/api/admin/ads/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_ids: adIds, new_orders: newOrders }),
      });

      if (!res.ok) throw new Error("Failed");
      setDirty(false);
      showToast("تم حفظ الترتيب بنجاح", true);
    } catch {
      showToast("حدث خطأ أثناء الحفظ، حاول مجدداً", false);
    } finally {
      setSaving(false);
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
            toast.ok
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => handleTabChange("tanazul")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "tanazul"
              ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          تنازل ({tanazul.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("taqib")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "taqib"
              ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          تعقيب ({taqib.length})
        </button>
      </div>

      {/* Save button */}
      {dirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ الترتيب"}
          </button>
        </div>
      )}

      {/* Sortable list */}
      {currentAds.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">لا توجد إعلانات نشطة</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={currentAds.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {currentAds.map((ad) => (
                <SortableItem key={ad.id} ad={ad} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
