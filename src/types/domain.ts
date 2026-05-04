export type WarehouseStockSnapshot = {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  city: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  priceCents: number;
  warehouses: WarehouseStockSnapshot[];
};

export type WarehouseListItem = {
  id: string;
  code: string;
  name: string;
  city: string;
};

export type ReservationDetails = {
  id: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    priceCents: number;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
};
