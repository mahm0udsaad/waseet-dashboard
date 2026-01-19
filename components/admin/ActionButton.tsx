type ActionButtonProps = {
  label: string;
  variant?: "primary" | "outline" | "danger";
};

const variantClasses: Record<NonNullable<ActionButtonProps["variant"]>, string> =
  {
    primary: "bg-[var(--brand)] text-white",
    outline: "border border-[var(--border)] text-slate-700",
    danger: "bg-rose-500 text-white",
  };

export function ActionButton({
  label,
  variant = "outline",
}: ActionButtonProps) {
  return (
    <button className={`rounded-full px-3 py-1 text-xs ${variantClasses[variant]}`}>
      {label}
    </button>
  );
}
