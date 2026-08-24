export class UnknownInventoryItemError extends Error {
  override readonly name = "UnknownInventoryItemError";

  constructor(sku: string) {
    super(`Unknown inventory item: ${sku}`);
  }
}

export class InvalidInventoryQuantityError extends Error {
  override readonly name = "InvalidInventoryQuantityError";

  constructor(quantity: number) {
    super(`Invalid inventory quantity: ${quantity}`);
  }
}

export class InsufficientStockError extends Error {
  override readonly name = "InsufficientStockError";

  constructor(sku: string, requested: number, available: number) {
    super(
      `Insufficient stock for ${sku}: requested ${requested}, available ${available}`,
    );
  }
}

export class Inventory {
  private readonly availableBySku = new Map<string, number>();

  constructor(initialStock: Readonly<Record<string, number>>) {
    for (const [sku, quantity] of Object.entries(initialStock)) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new InvalidInventoryQuantityError(quantity);
      }

      this.availableBySku.set(sku, quantity);
    }
  }

  available(sku: string): number {
    const quantity = this.availableBySku.get(sku);

    if (quantity === undefined) {
      throw new UnknownInventoryItemError(sku);
    }

    return quantity;
  }

  reserve(sku: string, quantity: number): void {
    this.assertPositiveQuantity(quantity);
    const available = this.available(sku);

    if (quantity > available) {
      throw new InsufficientStockError(sku, quantity, available);
    }

    this.availableBySku.set(sku, available - quantity);
  }

  release(sku: string, quantity: number): void {
    this.assertPositiveQuantity(quantity);
    this.availableBySku.set(sku, this.available(sku) + quantity);
  }

  private assertPositiveQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidInventoryQuantityError(quantity);
    }
  }
}
