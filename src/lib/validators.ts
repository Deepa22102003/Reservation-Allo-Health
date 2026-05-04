import { z } from "zod";

export const createReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(10),
});

export const reservationRouteParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
