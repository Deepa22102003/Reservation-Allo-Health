"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReservationDetails } from "@/types/domain";
import { formatMoney, formatDateTime } from "@/lib/utils";

type Props = { reservation: ReservationDetails };

function getRemainingSeconds(expiresAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

function isReservationDetails(v: unknown): v is ReservationDetails {
  return (
    v !== null &&
    typeof v === "object" &&
    "id" in v &&
    "status" in v &&
    "product" in v &&
    "warehouse" in v
  );
}

const STATUS_LABELS: Record<ReservationDetails["status"], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  RELEASED: "Released",
};

const STATUS_COLORS: Record<ReservationDetails["status"], string> = {
  PENDING: "bg-blue-500",
  CONFIRMED: "bg-emerald-500",
  RELEASED: "bg-neutral-400",
};

export function ReservationStatusCard({ reservation }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState<ReservationDetails>(reservation);
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(reservation.expiresAt)
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<
    "confirm" | "release" | null
  >(null);

  // Countdown timer - only runs while PENDING
  useEffect(() => {
    if (current.status !== "PENDING") return;

    const timer = window.setInterval(() => {
      setRemaining(getRemainingSeconds(current.expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [current.expiresAt, current.status]);

  const totalValue = useMemo(
    () => current.quantity * current.product.priceCents,
    [current.product.priceCents, current.quantity]
  );

  const isExpired = current.status === "PENDING" && remaining <= 0;
  const canAct = current.status === "PENDING" && !isExpired;

  async function mutate(action: "confirm" | "release") {
    setFeedback(null);
    setActionLoading(action);

    try {
      const response = await fetch(
        `/api/reservations/${current.id}/${action}`,
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
        }
      );

      const payload: unknown = await response.json();

      if (!response.ok) {
        setFeedback(
          getErrorMessage(payload, "Failed to update reservation.")
        );
        startTransition(() => router.refresh());
        return;
      }

      if (isReservationDetails(payload)) {
        setCurrent(payload);
        if (action === "release") setRemaining(0);
      }

      startTransition(() => router.refresh());
    } catch {
      setFeedback("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left: Order details */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-6">
        <div>
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
            Reservation #{current.id.slice(0, 8)}
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            {current.product.name}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {current.product.sku}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              Quantity
            </p>
            <p className="text-xl font-semibold text-neutral-900">
              {current.quantity}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              Unit price
            </p>
            <p className="text-xl font-semibold text-neutral-900">
              {formatMoney(current.product.priceCents)}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              Total
            </p>
            <p className="text-xl font-semibold text-neutral-900">
              {formatMoney(totalValue)}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
              Warehouse
            </p>
            <p className="text-sm font-semibold text-neutral-900 leading-snug">
              {current.warehouse.name}
            </p>
            <p className="text-xs text-neutral-400">
              {current.warehouse.city}
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Expires at</span>
            <span className="font-medium text-neutral-700">
              {formatDateTime(current.expiresAt)}
            </span>
          </div>
          {current.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Confirmed at</span>
              <span className="font-medium text-emerald-700">
                {formatDateTime(current.confirmedAt)}
              </span>
            </div>
          )}
          {current.releasedAt && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Released at</span>
              <span className="font-medium text-neutral-500">
                {formatDateTime(current.releasedAt)}
              </span>
            </div>
          )}
        </div>

        {feedback && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {feedback}
          </div>
        )}
      </div>

      {/* Right: Status + actions */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 flex flex-col gap-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[current.status]}`}
          />
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">
              Status
            </p>
            <p className="text-lg font-semibold text-neutral-900">
              {STATUS_LABELS[current.status]}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="rounded-lg bg-neutral-900 px-5 py-4 text-white">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            Hold expires in
          </p>
          <p
            className={`text-4xl font-mono font-semibold tabular-nums ${
              isExpired
                ? "text-red-400"
                : remaining <= 60
                ? "text-amber-400"
                : "text-white"
            }`}
          >
            {current.status === "PENDING"
              ? formatCountdown(remaining)
              : "--:--"}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            {current.status !== "PENDING"
              ? "This reservation is no longer active."
              : isExpired
              ? "Hold expired. Confirming will return a 410."
              : "Stock is held while the reservation is pending."}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 mt-auto">
          <button
            onClick={() => mutate("confirm")}
            disabled={!canAct || isPending || actionLoading !== null}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {actionLoading === "confirm" ? "Confirming…" : "Confirm purchase"}
          </button>
          <button
            onClick={() => mutate("release")}
            disabled={!canAct || isPending || actionLoading !== null}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:text-neutral-400"
          >
            {actionLoading === "release" ? "Cancelling…" : "Cancel"}
          </button>

          {(current.status === "CONFIRMED" ||
            current.status === "RELEASED" ||
            isExpired) && (
            <Link
              href="/products"
              className="block w-full rounded-lg border border-neutral-200 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Back to products
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
