"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/admin/SectionCard";
import { formatDate } from "@/lib/format";

type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  attachments: unknown[];
  created_at: string;
};

type DisputeChatData = {
  order: {
    id: string;
    status: string;
    dispute_reason: string | null;
    disputed_at: string | null;
  };
  payer: { id: string; full_name: string; phone: string } | null;
  beneficiary: { id: string; full_name: string; phone: string } | null;
  conversation_id: string | null;
  messages: Message[];
  message_count: number;
};

export function DisputeChat({ orderId }: { orderId: string }) {
  const [data, setData] = useState<DisputeChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/damin-orders/${orderId}/chat`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d) => setData(d))
      .catch(() => setError("تعذر تحميل المحادثة"))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <SectionCard title="محادثة النزاع" description="جارٍ تحميل المحادثة...">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </SectionCard>
    );
  }

  if (error || !data) {
    return (
      <SectionCard title="محادثة النزاع">
        <p className="text-sm text-slate-500">{error ?? "لا توجد بيانات"}</p>
      </SectionCard>
    );
  }

  const payerId = data.payer?.id;
  const beneficiaryId = data.beneficiary?.id;

  return (
    <SectionCard
      title="محادثة النزاع"
      description={`${data.message_count} رسالة بين الطرفين`}
    >
      {/* Dispute reason */}
      {data.order.dispute_reason && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-medium text-rose-600">سبب النزاع</p>
          <p className="mt-1 text-sm text-rose-900">{data.order.dispute_reason}</p>
          {data.order.disputed_at && (
            <p className="mt-1 text-xs text-rose-400">
              {formatDate(data.order.disputed_at)}
            </p>
          )}
        </div>
      )}

      {/* Party labels */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-600">
            الدافع: {data.payer?.full_name ?? "غير معروف"}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600">
            المستفيد: {data.beneficiary?.full_name ?? "غير معروف"}
          </span>
        </span>
      </div>

      {/* Messages */}
      {data.messages.length === 0 ? (
        <p className="text-sm text-slate-400">لا توجد رسائل في المحادثة</p>
      ) : (
        <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-slate-50 p-3">
          {data.messages.map((msg) => {
            const isPayer = msg.sender_id === payerId;
            const isBeneficiary = msg.sender_id === beneficiaryId;
            const senderName = isPayer
              ? data.payer?.full_name ?? "الدافع"
              : isBeneficiary
                ? data.beneficiary?.full_name ?? "المستفيد"
                : "النظام";
            const dotColor = isPayer
              ? "bg-blue-500"
              : isBeneficiary
                ? "bg-emerald-500"
                : "bg-slate-400";

            return (
              <div key={msg.id} className="rounded-lg bg-white p-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
                  <span className="font-medium text-slate-700">{senderName}</span>
                  <span className="text-slate-400">{formatDate(msg.created_at)}</span>
                </div>
                {msg.content && (
                  <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
