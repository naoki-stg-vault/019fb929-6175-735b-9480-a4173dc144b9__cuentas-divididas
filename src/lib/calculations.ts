import { CalculationOptions, ReceiptItem, ReceiptTotals } from "@/types/item";

/**
 * Rounds a number to 2 decimal places with financial accuracy.
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Safely parse a numeric string or input to float.
 */
export function parseNumber(value: string | number, fallback = 0): number {
  if (typeof value === "number") {
    return isNaN(value) ? fallback : value;
  }
  if (!value || typeof value !== "string") return fallback;
  // Replace comma with dot for European/LatAm input formats: "12,50" -> "12.50"
  const cleaned = value.trim().replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Calculates row total given quantity and unit price.
 */
export function calculateItemTotal(quantity: number, unitPrice: number): number {
  const safeQty = Math.max(0, isNaN(quantity) ? 0 : quantity);
  const safePrice = Math.max(0, isNaN(unitPrice) ? 0 : unitPrice);
  return roundCurrency(safeQty * safePrice);
}

/**
 * Calculates overall receipt totals (subtotal, tax, tip, discount, total).
 */
export function calculateTotals(
  items: ReceiptItem[],
  options: CalculationOptions = {}
): ReceiptTotals {
  const taxPercent = Math.max(0, options.taxPercent ?? 0);
  const tipPercent = Math.max(0, options.tipPercent ?? 0);
  const discountInput = Math.max(0, options.discount ?? 0);

  let subtotalRaw = 0;
  let itemCount = 0;

  for (const item of items) {
    const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
    subtotalRaw += itemTotal;
    itemCount += Math.max(0, item.quantity || 0);
  }

  const subtotal = roundCurrency(subtotalRaw);
  const discount = Math.min(subtotal, roundCurrency(discountInput));
  const discountedSubtotal = Math.max(0, subtotal - discount);

  const taxAmount = roundCurrency(discountedSubtotal * (taxPercent / 100));
  const tipAmount = roundCurrency(subtotal * (tipPercent / 100));
  const total = roundCurrency(discountedSubtotal + taxAmount + tipAmount);

  return {
    subtotal,
    taxPercent,
    taxAmount,
    tipPercent,
    tipAmount,
    discount,
    total,
    itemCount,
  };
}

/**
 * Formats a monetary number with thousands separators and 2 decimal places.
 */
export function formatCurrency(amount: number, symbol = "$"): string {
  const safe = roundCurrency(amount);
  const formatted = safe.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

/**
 * Validates a receipt item before adding or updating.
 */
export function validateReceiptItem(item: Partial<ReceiptItem>): {
  valid: boolean;
  errors: { description?: string; quantity?: string; unitPrice?: string };
} {
  const errors: { description?: string; quantity?: string; unitPrice?: string } = {};

  if (!item.description || item.description.trim().length === 0) {
    errors.description = "El nombre o descripción es obligatorio";
  } else if (item.description.trim().length > 120) {
    errors.description = "La descripción no puede superar 120 caracteres";
  }

  if (item.quantity === undefined || isNaN(item.quantity) || item.quantity <= 0) {
    errors.quantity = "La cantidad debe ser mayor a 0";
  }

  if (item.unitPrice === undefined || isNaN(item.unitPrice) || item.unitPrice < 0) {
    errors.unitPrice = "El precio debe ser igual o mayor a 0";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generates a unique client-side ID for new items.
 */
export function generateItemId(): string {
  return "item_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
}
