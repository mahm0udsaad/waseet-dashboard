"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/admin/Badge";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { ROLE_NAV_ACCESS, type AdminRole } from "@/lib/auth/permissions";

type TeamMember = {
  user_id: string;
  display_name: string;
  phone: string;
  avatar_url: string | null;
  role: AdminRole;
  status: string;
  created_at: string;
};

type SearchUser = {
  user_id: string;
  display_name: string;
  phone: string;
  avatar_url: string | null;
  role: string;
};

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "مدير أعلى" },
  { value: "admin", label: "مدير" },
  { value: "finance", label: "مالية" },
  { value: "support_agent", label: "وكيل دعم" },
  { value: "viewer", label: "مشاهد" },
];

const ROLE_BADGE_TONE: Record<AdminRole, "success" | "warning" | "neutral" | "danger"> = {
  super_admin: "danger",
  admin: "success",
  finance: "warning",
  support_agent: "neutral",
  viewer: "neutral",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير أعلى",
  admin: "مدير",
  finance: "مالية",
  support_agent: "وكيل دعم",
  viewer: "مشاهد",
};

type Props = {
  initialMembers: TeamMember[];
  currentUserId: string;
  currentUserRole: AdminRole;
};

export function TeamManager({ initialMembers, currentUserId, currentUserRole }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [addRole, setAddRole] = useState<AdminRole>("viewer");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Create member
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<AdminRole>("viewer");
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  // Edit role modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("viewer");

  // Remove modal
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);

  function generatePassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pw = "";
    for (let i = 0; i < 14; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setCreatePassword(pw);
  }

  async function createMember() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createEmail,
          password: createPassword,
          displayName: createName,
          role: createRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء العضو");
        return;
      }
      setCreatedCreds({ email: createEmail, password: createPassword });
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      setCreateRole("viewer");
      router.refresh();
      const membersRes = await fetch("/api/admin/team");
      const membersData = await membersRes.json();
      setMembers(membersData.members ?? []);
    } catch {
      setError("حدث خطأ");
    } finally {
      setCreating(false);
    }
  }

  const searchUsers = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/team/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.users ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  async function addMember(userId: string) {
    setLoading(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: addRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إضافة العضو");
        return;
      }
      setSearchQuery("");
      setSearchResults([]);
      router.refresh();
      // Reload members
      const membersRes = await fetch("/api/admin/team");
      const membersData = await membersRes.json();
      setMembers(membersData.members ?? []);
    } catch {
      setError("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  async function updateRole() {
    if (!editingMember) return;
    setLoading(editingMember.user_id);
    setError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingMember.user_id, role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل تحديث الدور");
        return;
      }
      setEditingMember(null);
      router.refresh();
      const membersRes = await fetch("/api/admin/team");
      const membersData = await membersRes.json();
      setMembers(membersData.members ?? []);
    } catch {
      setError("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  async function removeMember() {
    if (!removingMember) return;
    setLoading(removingMember.user_id);
    setError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: removingMember.user_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إزالة العضو");
        return;
      }
      setRemovingMember(null);
      router.refresh();
      const membersRes = await fetch("/api/admin/team");
      const membersData = await membersRes.json();
      setMembers(membersData.members ?? []);
    } catch {
      setError("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  const canManageRole = (memberRole: AdminRole) => {
    if (currentUserRole === "super_admin") return true;
    if (memberRole === "super_admin") return false;
    return currentUserRole === "admin";
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Create New Member Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">إنشاء عضو جديد</h3>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreatedCreds(null); }}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {showCreate ? "إغلاق" : "إنشاء حساب"}
          </button>
        </div>

        {showCreate && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-600 mb-1">الاسم</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="اسم العضو"
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-600 mb-1">كلمة المرور</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="whitespace-nowrap rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    توليد تلقائي
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">الدور</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  {ROLE_OPTIONS.filter(
                    (r) => currentUserRole === "super_admin" || r.value !== "super_admin"
                  ).map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Show allowed pages for the selected role */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">
                الصفحات المتاحة لهذا الدور:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(ROLE_NAV_ACCESS[createRole] ?? []).map((path) => (
                  <span
                    key={path}
                    className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600"
                  >
                    {path.replace("/", "")}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={createMember}
              disabled={creating || !createEmail || !createPassword || !createName}
              className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              {creating ? "جارٍ الإنشاء..." : "إنشاء العضو"}
            </button>
          </div>
        )}

        {/* Show created credentials */}
        {createdCreds && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800 mb-2">
              تم إنشاء العضو بنجاح! احفظ بيانات الدخول:
            </p>
            <div className="space-y-1 text-sm font-mono" dir="ltr">
              <p className="text-emerald-700">
                Email: <span className="font-bold">{createdCreds.email}</span>
              </p>
              <p className="text-emerald-700">
                Password: <span className="font-bold">{createdCreds.password}</span>
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`
                );
              }}
              className="mt-2 rounded-full border border-emerald-300 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
            >
              نسخ البيانات
            </button>
          </div>
        )}
      </div>

      {/* Add Existing Member Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">ترقية مستخدم موجود</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">بحث عن مستخدم</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="اسم المستخدم أو رقم الجوال..."
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">الدور</label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as AdminRole)}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.filter(
                (r) => currentUserRole === "super_admin" || r.value !== "super_admin"
              ).map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results */}
        {(searchResults.length > 0 || searching) && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            {searching ? (
              <div className="p-3 text-sm text-slate-500 text-center">جاري البحث...</div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--border)] last:border-0 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {user.display_name?.charAt(0) ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.display_name}</p>
                      <p className="text-xs text-slate-500" dir="ltr">{user.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addMember(user.user_id)}
                    disabled={loading === user.user_id}
                    className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {loading === user.user_id ? "جارٍ..." : "إضافة"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Team Members Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          أعضاء الفريق ({members.length})
        </h3>

        {members.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">لا يوجد أعضاء في الفريق</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 text-right font-medium text-slate-600">العضو</th>
                  <th className="pb-3 text-right font-medium text-slate-600">رقم الجوال</th>
                  <th className="pb-3 text-right font-medium text-slate-600">الدور</th>
                  <th className="pb-3 text-right font-medium text-slate-600">الحالة</th>
                  <th className="pb-3 text-right font-medium text-slate-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isCurrentUser = member.user_id === currentUserId;
                  const canManage = canManageRole(member.role) && !isCurrentUser;

                  return (
                    <tr
                      key={member.user_id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                              {member.display_name?.charAt(0) ?? "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {member.display_name}
                              {isCurrentUser && (
                                <span className="mr-1 text-xs text-slate-400">(أنت)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600" dir="ltr">
                        {member.phone}
                      </td>
                      <td className="py-3">
                        <Badge
                          label={ROLE_LABELS[member.role] ?? member.role}
                          tone={ROLE_BADGE_TONE[member.role] ?? "neutral"}
                        />
                      </td>
                      <td className="py-3">
                        <Badge
                          label={member.status === "active" ? "نشط" : "معطّل"}
                          tone={member.status === "active" ? "success" : "warning"}
                        />
                      </td>
                      <td className="py-3">
                        {canManage ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingMember(member);
                                setEditRole(member.role);
                              }}
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-slate-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => setRemovingMember(member)}
                              className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              إزالة
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditingMember(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">تعديل دور العضو</h3>
            <p className="mt-1 text-sm text-slate-500">
              {editingMember.display_name}
            </p>
            <div className="mt-4">
              <label className="block text-sm text-slate-600 mb-2">الدور الجديد</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AdminRole)}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.filter(
                  (r) => currentUserRole === "super_admin" || r.value !== "super_admin"
                ).map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setEditingMember(null)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={updateRole}
                disabled={loading === editingMember.user_id || editRole === editingMember.role}
                className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading === editingMember.user_id ? "جارٍ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmationModal
        open={!!removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={removeMember}
        title="إزالة عضو من الفريق"
        message={`هل أنت متأكد من إزالة "${removingMember?.display_name}" من فريق الإدارة؟ سيتم إعادة دوره إلى "مستخدم عادي".`}
        confirmLabel="إزالة"
        variant="danger"
        loading={loading === removingMember?.user_id}
      />
    </div>
  );
}
