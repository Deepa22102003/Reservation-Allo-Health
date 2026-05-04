const reservationTtlMinutes = Number(process.env.RESERVATION_TTL_MINUTES ?? "10");

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export const env = {
  reservationTtlMinutes:
    Number.isFinite(reservationTtlMinutes) && reservationTtlMinutes > 0
      ? reservationTtlMinutes
      : 10,
};
