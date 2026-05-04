import { listProducts, listWarehouses } from "@/lib/catalog";
import { handleRouteError, ok } from "@/lib/http";

export async function GET() {
  try {
    const [products, warehouses] = await Promise.all([
      listProducts(),
      listWarehouses(),
    ]);
    return ok({ products, warehouses });
  } catch (error) {
    return handleRouteError(error);
  }
}
