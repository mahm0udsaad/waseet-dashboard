"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type UserProfile = {
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
  latest_withdrawal: {
    iban: string | null;
    bank_name: string | null;
    account_holder_name: string | null;
    admin_note: string | null;
    created_at: string;
    processed_at: string | null;
    status: string;
  } | null;
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

    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/info?ids=${userIds.join(",")}`, {
          headers: { accept: "application/json" },
        });
        const data = (await response.json()) as { users?: UserProfile[] };
        if (!cancelled) {
          setUsers(data.users ?? []);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, userIds]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
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
              const latestWithdrawal = user.latest_withdrawal;
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
                  {latestWithdrawal ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-700">
                        آخر بيانات بنكية
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        اسم البنك: {latestWithdrawal.bank_name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        اسم صاحب الحساب:{" "}
                        {latestWithdrawal.account_holder_name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        آخر ملاحظة إدارية: {latestWithdrawal.admin_note ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        رقم الحساب / IBAN:
                      </p>
                      <p
                        className="mt-1 break-all rounded-lg bg-white px-2 py-1 font-mono text-xs text-slate-900"
                        dir="ltr"
                      >
                        {latestWithdrawal.iban ?? "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">
                      لا توجد بيانات بنكية محفوظة لهذا المستخدم.
                    </p>
                  )}
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
    </div>,
    document.body
  );
}
