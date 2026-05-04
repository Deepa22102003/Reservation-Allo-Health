"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductListItem } from "@/types/domain";
import { formatMoney } from "@/lib/utils";

type Props = {
  products: ProductListItem[];
  databaseConfigured: boolean;
};

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

function StockBar({ available, total }: { available: number; total: number }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  const color =
    pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-1 w-full rounded-full bg-neutral-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProductGrid({ products, databaseConfigured }: Props) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalAvailable = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum + p.warehouses.reduce((s, w) => s + w.availableQuantity, 0),
        0
      ),
    [products]
  );

  async function reserve(productId: string, warehouseId: string) {
    if (!databaseConfigured) {
      setErrorMessage(
        "Database not connected. Add DATABASE_URL to enable reservations."
      );
      return;
    }

    setErrorMessage(null);
    const key = `${productId}:${warehouseId}`;
    setPendingKey(key);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      });

      const payload: unknown = await response.json();

      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("id" in payload)
      ) {
        setErrorMessage(
          getErrorMessage(payload, "Unable to reserve stock right now.")
        );
        return;
      }

      startTransition(() => {
        router.push(`/reservations/${String(payload.id)}`);
        router.refresh();
      });
    } catch {
      setErrorMessage("Network error while creating the reservation.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4">
        <p className="text-sm text-neutral-600">
          {products.length} products across{" "}
          {
            new Set(
              products.flatMap((p) => p.warehouses.map((w) => w.warehouseId))
            ).size
          }{" "}
          warehouses
        </p>
        <div className="text-right">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">
            Total available
          </p>
          <p className="text-lg font-semibold text-neutral-900">
            {totalAvailable}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const totalAvail = product.warehouses.reduce(
            (sum, w) => sum + w.availableQuantity,
            0
          );
          const inStock = totalAvail > 0;

          return (
            <article
              key={product.id}
              className="flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden"
            >
              {/* Product header */}
              <div className="p-5 border-b border-neutral-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
                      {product.sku}
                    </p>
                    <h3 className="font-semibold text-neutral-900 leading-snug">
                      {product.name}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded-md ${
                      inStock
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {inStock ? "In stock" : "Sold out"}
                  </span>
                </div>
                {product.description && (
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Price + warehouses */}
              <div className="flex-1 p-5 space-y-4">
                <p className="text-xl font-semibold text-neutral-900">
                  {formatMoney(product.priceCents)}
                </p>

                <div className="space-y-3">
                  {product.warehouses.map((w) => {
                    const key = `${product.id}:${w.warehouseId}`;
                    const isLoading = pendingKey === key && isPending;
                    const disabled =
                      w.availableQuantity === 0 ||
                      pendingKey !== null ||
                      isPending;

                    return (
                      <div key={w.warehouseId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-700">
                              {w.warehouseName}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {w.city} · {w.warehouseCode}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-neutral-900">
                                {w.availableQuantity}
                              </p>
                              <p className="text-xs text-neutral-400">
                                of {w.totalQuantity}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                reserve(product.id, w.warehouseId)
                              }
                              disabled={disabled}
                              className="min-w-[80px] rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
                            >
                              {isLoading
                                ? "…"
                                : w.availableQuantity === 0
                                ? "Sold out"
                                : "Reserve"}
                            </button>
                          </div>
                        </div>
                        <StockBar
                          available={w.availableQuantity}
                          total={w.totalQuantity}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
