import { confirmReservation } from "@/lib/reservations";
import { handleRouteError, ok } from "@/lib/http";
import { reservationRouteParamsSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = reservationRouteParamsSchema.parse(await context.params);
    const reservation = await confirmReservation(id);
    return ok(reservation);
  } catch (error) {
    return handleRouteError(error);
  }
}
