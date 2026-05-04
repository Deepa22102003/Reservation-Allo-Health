import { Prisma, ReservationStatus } from "@prisma/client";
import { env, isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { ReservationDetails } from "@/types/domain";
import type { CreateReservationInput } from "@/lib/validators";

/* ------------------------------------------------------------------ */
/*  Error                                                               */
/* ------------------------------------------------------------------ */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: { product: true; warehouse: true };
}>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getExpiryDate(): Date {
  return new Date(Date.now() + env.reservationTtlMinutes * 60 * 1000);
}

function mapToDetails(r: ReservationWithRelations): ReservationDetails {
  return {
    id: r.id,
    quantity: r.quantity,
    status: r.status as ReservationDetails["status"],
    expiresAt: r.expiresAt.toISOString(),
    confirmedAt: r.confirmedAt?.toISOString() ?? null,
    releasedAt: r.releasedAt?.toISOString() ?? null,
    product: {
      id: r.product.id,
      name: r.product.name,
      sku: r.product.sku,
      priceCents: r.product.priceCents,
    },
    warehouse: {
      id: r.warehouse.id,
      code: r.warehouse.code,
      name: r.warehouse.name,
      city: r.warehouse.city,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Release expired holds (called inside transactions before writes)   */
/* ------------------------------------------------------------------ */

async function releaseExpiredForInventory(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string
): Promise<void> {
  const expired = await tx.reservation.findMany({
    where: {
      productId,
      warehouseId,
      status: ReservationStatus.PENDING,
      expiresAt: { lte: new Date() },
    },
    select: { id: true, quantity: true },
  });

  if (expired.length === 0) return;

  const releasedQty = expired.reduce((sum, r) => sum + r.quantity, 0);

  await tx.reservation.updateMany({
    where: { id: { in: expired.map((r) => r.id) } },
    data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
  });

  await tx.inventoryItem.updateMany({
    where: { productId, warehouseId },
    data: { reservedQuantity: { decrement: releasedQty } },
  });
}

/* ------------------------------------------------------------------ */
/*  GET                                                                 */
/* ------------------------------------------------------------------ */

export async function getReservationDetails(
  id: string
): Promise<ReservationDetails | null> {
  if (!isDatabaseConfigured()) return null;

  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });

  return r ? mapToDetails(r) : null;
}

/* ------------------------------------------------------------------ */
/*  CREATE                                                              */
/* ------------------------------------------------------------------ */

export async function createReservation(
  input: CreateReservationInput,
  idempotencyKey?: string | null
): Promise<ReservationDetails> {
  if (!isDatabaseConfigured()) {
    throw new AppError("Database not configured", 503);
  }

  return prisma.$transaction(async (tx) => {
    // Idempotency: return existing if same key
    if (idempotencyKey) {
      const existing = await tx.reservation.findUnique({
        where: { idempotencyKey },
        include: { product: true, warehouse: true },
      });
      if (existing) return mapToDetails(existing);
    }

    // Sweep expired holds to free up stock
    await releaseExpiredForInventory(tx, input.productId, input.warehouseId);

    const inventoryItem = await tx.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId: input.warehouseId,
        },
      },
    });

    if (!inventoryItem) {
      throw new AppError("Inventory not found", 404);
    }

    // Atomic stock decrement with guard — prevents race conditions
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: inventoryItem.id,
        // Ensures available = total - reserved >= requested quantity
        totalQuantity: {
          gte: inventoryItem.reservedQuantity + input.quantity,
        },
      },
      data: { reservedQuantity: { increment: input.quantity } },
    });

    if (updated.count === 0) {
      throw new AppError("Not enough stock available", 409);
    }

    const reservation = await tx.reservation.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryItemId: inventoryItem.id,
        quantity: input.quantity,
        expiresAt: getExpiryDate(),
        idempotencyKey: idempotencyKey ?? undefined,
      },
      include: { product: true, warehouse: true },
    });

    return mapToDetails(reservation);
  });
}

/* ------------------------------------------------------------------ */
/*  CONFIRM                                                             */
/* ------------------------------------------------------------------ */

export async function confirmReservation(
  id: string
): Promise<ReservationDetails> {
  if (!isDatabaseConfigured()) {
    throw new AppError("Database not configured", 503);
  }

  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!r) throw new AppError("Reservation not found", 404);

    // Idempotent confirm
    if (r.status === ReservationStatus.CONFIRMED) return mapToDetails(r);

    if (r.status === ReservationStatus.RELEASED) {
      throw new AppError("Reservation already released", 410);
    }

    // Expired
    if (r.expiresAt <= new Date()) {
      await tx.inventoryItem.update({
        where: { id: r.inventoryItemId },
        data: { reservedQuantity: { decrement: r.quantity } },
      });
      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
      });
      throw new AppError("Reservation expired", 410);
    }

    // Deduct permanently from total stock
    await tx.inventoryItem.update({
      where: { id: r.inventoryItemId },
      data: {
        totalQuantity: { decrement: r.quantity },
        reservedQuantity: { decrement: r.quantity },
      },
    });

    const confirmed = await tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED, confirmedAt: new Date() },
      include: { product: true, warehouse: true },
    });

    return mapToDetails(confirmed);
  });
}

/* ------------------------------------------------------------------ */
/*  RELEASE                                                             */
/* ------------------------------------------------------------------ */

export async function releaseReservation(
  id: string
): Promise<ReservationDetails> {
  if (!isDatabaseConfigured()) {
    throw new AppError("Database not configured", 503);
  }

  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!r) throw new AppError("Reservation not found", 404);

    // Idempotent release
    if (r.status !== ReservationStatus.PENDING) return mapToDetails(r);

    await tx.inventoryItem.update({
      where: { id: r.inventoryItemId },
      data: { reservedQuantity: { decrement: r.quantity } },
    });

    const released = await tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.RELEASED, releasedAt: new Date() },
      include: { product: true, warehouse: true },
    });

    return mapToDetails(released);
  });
}
