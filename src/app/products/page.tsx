import { listProducts } from "@/lib/catalog";
import { isDatabaseConfigured } from "@/lib/env";
import { ProductGrid } from "@/components/product-grid";

export const revalidate = 0;

export default async function ProductsPage() {
  const products = await listProducts();
  const databaseConfigured = isDatabaseConfigured();

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              ReserveX
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Multi-warehouse inventory
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                databaseConfigured ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            {databaseConfigured ? "Live database" : "Sample data"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {!databaseConfigured && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <strong className="font-medium">Database not connected.</strong>{" "}
            Add <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">DATABASE_URL</code>{" "}
            and run Prisma migrations to enable live reservations. Showing sample
            data for now.
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Available Products
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Select a product and warehouse to place a short-lived checkout hold.
          </p>
        </div>

        <ProductGrid products={products} databaseConfigured={databaseConfigured} />
      </div>
    </main>
  );
}
