import { createReservation } from "@/lib/reservations";
import { handleRouteError, ok } from "@/lib/http";
import { createReservationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ?? undefined;

    const body = await request.json();
    const input = createReservationSchema.parse(body);
    const reservation = await createReservation(input, idempotencyKey);

    return ok(reservation, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
