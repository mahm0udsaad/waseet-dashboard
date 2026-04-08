"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type DropdownItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
};

type ActionDropdownProps = {
  items: DropdownItem[];
};

export function ActionDropdown({ items }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = Math.max(menuRef.current?.offsetWidth ?? 220, 220);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const estimatedMenuHeight = menuRef.current?.offsetHeight ?? 180;
      const openUp =
        viewportHeight - rect.bottom < estimatedMenuHeight + 16 &&
        rect.top > estimatedMenuHeight + 16;

      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        viewportWidth - menuWidth - 8
      );

      setPosition({
        top: openUp ? rect.top - 8 : rect.bottom + 8,
        left,
        placement: openUp ? "top" : "bottom",
      });
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    updatePosition();
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="فتح خيارات الإجراءات"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <span>خيارات</span>
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[220] min-w-[220px] rounded-xl border border-[var(--border)] bg-white py-1 shadow-2xl"
              style={{
                top: position.top,
                left: position.left,
                transform:
                  position.placement === "top" ? "translateY(-100%)" : undefined,
              }}
            >
              {items.map((item) => {
                const className = `flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-slate-50 ${
                  item.variant === "danger"
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-700"
                }`;

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      role="menuitem"
                      className={className}
                      onClick={() => setOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className={className}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
