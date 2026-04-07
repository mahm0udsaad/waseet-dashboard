"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "ليس لديك صلاحية للوصول إلى لوحة التحكم",
  forbidden: "صلاحيات غير كافية للوصول إلى هذه الصفحة",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setError(ERROR_MESSAGES[errorParam]);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "فشل تسجيل الدخول");
          return;
        }
        router.push("/overview");
        router.refresh();
      } catch {
        setError("حدث خطأ أثناء تسجيل الدخول");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-light)] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          تسجيل الدخول
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          أدخل بريدك الإلكتروني وكلمة المرور
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-600">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-600">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              dir="ltr"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
