import type { ProductListItem, WarehouseListItem } from "@/types/domain";

export const sampleWarehouses: WarehouseListItem[] = [
  { id: "wh_bom", code: "BOM", name: "Mumbai FC", city: "Mumbai" },
  { id: "wh_del", code: "DEL", name: "Delhi FC", city: "New Delhi" },
  { id: "wh_blr", code: "BLR", name: "Bengaluru FC", city: "Bengaluru" },
];

export const sampleProducts: ProductListItem[] = [
  {
    id: "prod_headphones",
    sku: "ALLO-HP-001",
    name: "Pulse Wireless Headphones",
    description: "Mid-premium wireless headphones with 40h battery life.",
    priceCents: 899900,
    warehouses: [
      {
        warehouseId: "wh_bom",
        warehouseCode: "BOM",
        warehouseName: "Mumbai FC",
        city: "Mumbai",
        totalQuantity: 8,
        reservedQuantity: 2,
        availableQuantity: 6,
      },
      {
        warehouseId: "wh_del",
        warehouseCode: "DEL",
        warehouseName: "Delhi FC",
        city: "New Delhi",
        totalQuantity: 5,
        reservedQuantity: 1,
        availableQuantity: 4,
      },
    ],
  },
  {
    id: "prod_keyboard",
    sku: "ALLO-KB-004",
    name: "Mechanical Keyboard",
    description: "Hot-swappable keyboard designed for fast fulfillment demos.",
    priceCents: 649900,
    warehouses: [
      {
        warehouseId: "wh_blr",
        warehouseCode: "BLR",
        warehouseName: "Bengaluru FC",
        city: "Bengaluru",
        totalQuantity: 4,
        reservedQuantity: 0,
        availableQuantity: 4,
      },
      {
        warehouseId: "wh_del",
        warehouseCode: "DEL",
        warehouseName: "Delhi FC",
        city: "New Delhi",
        totalQuantity: 3,
        reservedQuantity: 2,
        availableQuantity: 1,
      },
    ],
  },
  {
    id: "prod_monitor",
    sku: "ALLO-MN-002",
    name: "4K Ultra Monitor",
    description:
      "32-inch 4K display with 144Hz refresh rate. Perfect for professionals and gamers.",
    priceCents: 2499900,
    warehouses: [
      {
        warehouseId: "wh_bom",
        warehouseCode: "BOM",
        warehouseName: "Mumbai FC",
        city: "Mumbai",
        totalQuantity: 12,
        reservedQuantity: 3,
        availableQuantity: 9,
      },
      {
        warehouseId: "wh_blr",
        warehouseCode: "BLR",
        warehouseName: "Bengaluru FC",
        city: "Bengaluru",
        totalQuantity: 7,
        reservedQuantity: 2,
        availableQuantity: 5,
      },
    ],
  },
  {
    id: "prod_mouse",
    sku: "ALLO-MS-003",
    name: "Ergonomic Wireless Mouse",
    description:
      "Precision ergonomic design with adjustable DPI and long battery life.",
    priceCents: 249900,
    warehouses: [
      {
        warehouseId: "wh_del",
        warehouseCode: "DEL",
        warehouseName: "Delhi FC",
        city: "New Delhi",
        totalQuantity: 25,
        reservedQuantity: 5,
        availableQuantity: 20,
      },
      {
        warehouseId: "wh_bom",
        warehouseCode: "BOM",
        warehouseName: "Mumbai FC",
        city: "Mumbai",
        totalQuantity: 18,
        reservedQuantity: 3,
        availableQuantity: 15,
      },
      {
        warehouseId: "wh_blr",
        warehouseCode: "BLR",
        warehouseName: "Bengaluru FC",
        city: "Bengaluru",
        totalQuantity: 16,
        reservedQuantity: 4,
        availableQuantity: 12,
      },
    ],
  },
];
