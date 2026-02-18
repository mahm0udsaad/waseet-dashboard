"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserProfile = {
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
};

type UserInfoModalProps = {
  open: boolean;
  onClose: () => void;
  userIds: string[];
};

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "text-emerald-700 bg-emerald-100" },
  banned: { label: "محظور", color: "text-rose-700 bg-rose-100" },
  deleted: { label: "محذوف", color: "text-slate-700 bg-slate-100" },
};

const roleMap: Record<string, string> = {
  super_admin: "مدير أعلى",
  admin: "مدير",
  finance: "مالية",
  support_agent: "وكيل دعم",
  viewer: "مشاهد",
  user: "مستخدم",
};

export function UserInfoModal({ open, onClose, userIds }: UserInfoModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || userIds.length === 0) return;
    setLoading(true);
    fetch(`/api/admin/users/info?ids=${userIds.join(",")}`, {
      headers: { accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, userIds]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">
          معلومات المستخدمين
        </h3>

        {loading ? (
          <div className="mt-4 text-center text-sm text-slate-500">
            جارٍ التحميل...
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {users.map((user) => {
              const st = statusMap[user.status] ?? statusMap.active;
              return (
                <div
                  key={user.user_id}
                  className="rounded-xl border border-[var(--border)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-900">
                      {user.display_name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {user.email && (
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  )}
                  {user.phone && (
                    <p className="mt-1 text-xs text-slate-500">
                      الجوال: {user.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    الدور: {roleMap[user.role] ?? user.role}
                  </p>
                  <Link
                    href={`/users/${user.user_id}`}
                    className="mt-2 inline-block text-xs text-[var(--brand)] hover:underline"
                    onClick={onClose}
                  >
                    عرض الملف الكامل
                  </Link>
                </div>
              );
            })}
            {users.length === 0 && (
              <p className="text-center text-sm text-slate-500">
                لا توجد بيانات
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
