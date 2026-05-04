import Link from "next/link";
import { notFound } from "next/navigation";
import { getReservationDetails } from "@/lib/reservations";
import { isDatabaseConfigured } from "@/lib/env";
import { ReservationStatusCard } from "@/components/reservation-status-card";

type Props = { params: Promise<{ id: string }> };

export default async function ReservationPage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-xl border border-amber-200 bg-amber-50 p-8">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-3">
            Setup required
          </p>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">
            Connect your database to continue
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            Add <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">DATABASE_URL</code>{" "}
            and run Prisma migrations to enable the reservation flow.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            ← Back to products
          </Link>
        </div>
      </main>
    );
  }

  const reservation = await getReservationDetails(id);

  if (!reservation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              ReserveX
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">Checkout hold</p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            ← Products
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <ReservationStatusCard reservation={reservation} />
      </div>
    </main>
  );
}
