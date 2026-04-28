"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Subscribes to INSERT events on tables that drive sidebar badge counts and
 * returns a per-path delta the SidebarNav can add to its server-rendered
 * counts. The deltas reset for a path once the user navigates to it (handled
 * by the parent via the `currentPageKey` prop).
 *
 * This is a best-effort live indicator — counts may briefly diverge from the
 * server until the next page load.
 */
export function useRealtimeBadgeBumps(currentPageKey: string | null) {
  const [bumps, setBumps] = useState<Record<string, number>>({});

  // Reset the delta for the page the user is viewing.
  useEffect(() => {
    if (!currentPageKey) return;
    setBumps((prev) => {
      if (!prev[currentPageKey]) return prev;
      const next = { ...prev };
      delete next[currentPageKey];
      return next;
    });
  }, [currentPageKey]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    function bump(path: string) {
      setBumps((prev) => ({ ...prev, [path]: (prev[path] ?? 0) + 1 }));
    }

    const channel = supabase
      .channel("admin-sidebar-bumps")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          bump("/orders");
          const row = payload.new as { payment_method?: string; status?: string };
          if (
            row?.payment_method === "bank_transfer" &&
            row?.status === "awaiting_admin_transfer_approval"
          ) {
            bump("/bank-transfers");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { payment_method?: string; status?: string };
          if (
            row?.payment_method === "bank_transfer" &&
            row?.status === "awaiting_admin_transfer_approval"
          ) {
            bump("/bank-transfers");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "damin_orders" },
        () => bump("/damin-orders")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_requests" },
        () => bump("/withdrawals")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "payments" },
        () => bump("/payments")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          bump("/chats");
          const row = payload.new as { status?: string };
          if (row?.status === "open") bump("/support-inbox");
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        () => bump("/support-tickets")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "disputes" },
        () => bump("/disputes")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ads" },
        () => bump("/ads")
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        () => bump("/users")
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return bumps;
}
