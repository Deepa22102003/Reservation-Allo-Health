import type { ProductListItem, WarehouseListItem } from "@/types/domain";
import { isDatabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sampleProducts, sampleWarehouses } from "@/lib/sample-data";

export async function listProducts(): Promise<ProductListItem[]> {
  if (!isDatabaseConfigured()) return sampleProducts;

  const products = await prisma.product.findMany({
    include: {
      inventoryItems: {
        include: { warehouse: true },
        orderBy: { warehouse: { code: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    warehouses: product.inventoryItems.map((item) => ({
      warehouseId: item.warehouseId,
      warehouseCode: item.warehouse.code,
      warehouseName: item.warehouse.name,
      city: item.warehouse.city,
      totalQuantity: item.totalQuantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.totalQuantity - item.reservedQuantity,
    })),
  }));
}

export async function listWarehouses(): Promise<WarehouseListItem[]> {
  if (!isDatabaseConfigured()) return sampleWarehouses;

  const warehouses = await prisma.warehouse.findMany({
    orderBy: { code: "asc" },
  });

  return warehouses.map((w) => ({
    id: w.id,
    code: w.code,
    name: w.name,
    city: w.city,
  }));
}
