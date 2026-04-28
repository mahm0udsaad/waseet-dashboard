import { Check, Circle, X } from "lucide-react";

type Step = {
  key: string;
  label: string;
};

const STEPS: Step[] = [
  { key: "created", label: "تم الإنشاء" },
  { key: "pending_confirmations", label: "بانتظار التأكيد" },
  { key: "both_confirmed", label: "تم التأكيد" },
  { key: "payment_submitted", label: "تم الدفع" },
  { key: "awaiting_completion", label: "قيد التنفيذ" },
  { key: "completion_requested", label: "طلب اكتمال" },
  { key: "completed", label: "مكتمل" },
];

// Index of each step status — used to compute "what's already happened"
const STEP_INDEX: Record<string, number> = STEPS.reduce(
  (acc, s, i) => ({ ...acc, [s.key]: i }),
  {}
);

type Props = {
  status: string;
};

export function DaminPipeline({ status }: Props) {
  const isCancelled = status === "cancelled";
  const isDisputed = status === "disputed";
  const isTerminal = isCancelled || isDisputed;

  // Find the step that matches the current status; for terminal states we
  // approximate "where it stopped" by stepping forward through the flow.
  const currentIndex = isTerminal
    ? STEPS.length // all steps inactive
    : (STEP_INDEX[status] ?? 0);

  return (
    <section className="admin-panel rounded-[28px] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            مراحل الطلب
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {isCancelled
              ? "تم إلغاء الطلب"
              : isDisputed
                ? "الطلب في حالة نزاع"
                : "تتبّع موضع الطلب في خط سير الضامن"}
          </h3>
        </div>
        {isTerminal ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isCancelled
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <X className="h-3 w-3" />
            {isCancelled ? "ملغي" : "نزاع"}
          </span>
        ) : null}
      </div>

      {/* Horizontal step indicator — RTL aware via flex-row + I18nManager not needed here (web RTL handled by html dir). */}
      <ol className="flex items-start gap-2 overflow-x-auto pb-2 sm:gap-3">
        {STEPS.map((step, i) => {
          const done = !isTerminal && i < currentIndex;
          const active = !isTerminal && i === currentIndex;
          const future = !done && !active;

          let circleClass: string;
          let textClass: string;
          if (active) {
            circleClass = "bg-[var(--brand)] text-white ring-4 ring-rose-100";
            textClass = "text-slate-950 font-semibold";
          } else if (done) {
            circleClass = "bg-emerald-600 text-white";
            textClass = "text-slate-700";
          } else if (isTerminal) {
            circleClass = "bg-slate-100 text-slate-300";
            textClass = "text-slate-300";
          } else {
            circleClass = "bg-slate-100 text-slate-400";
            textClass = "text-slate-400";
          }

          return (
            <li
              key={step.key}
              className="flex min-w-[112px] flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full items-center">
                {/* connector line on the leading side (right in RTL) */}
                <span
                  className={`h-0.5 flex-1 ${
                    i === 0
                      ? "bg-transparent"
                      : done || active
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                  }`}
                />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${circleClass}`}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </span>
                {/* trailing connector */}
                <span
                  className={`h-0.5 flex-1 ${
                    i === STEPS.length - 1
                      ? "bg-transparent"
                      : done
                        ? "bg-emerald-300"
                        : "bg-slate-200"
                  }`}
                />
              </div>
              <p className={`text-center text-xs leading-tight ${textClass}`}>
                {step.label}
              </p>
              {/* hide-on-mobile gracefully: fall back to scroll, future = lighter */}
              {future && !isTerminal ? null : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
