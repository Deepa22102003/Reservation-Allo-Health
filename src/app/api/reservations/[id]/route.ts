import { getReservationDetails } from "@/lib/reservations";
import { handleRouteError, ok } from "@/lib/http";
import { reservationRouteParamsSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = reservationRouteParamsSchema.parse(await context.params);
    const reservation = await getReservationDetails(id);

    if (!reservation) {
      return NextResponse.json({ message: "Reservation not found" }, { status: 404 });
    }

    return ok(reservation);
  } catch (error) {
    return handleRouteError(error);
  }
}
