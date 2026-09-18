export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  confidence?: number; // Score from 0 to 1 detected by OCR (e.g. < 0.7 needs review)
  isManuallyAdded?: boolean;
  notes?: string;
}

export interface ReceiptTotals {
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  tipPercent: number;
  tipAmount: number;
  discount: number;
  total: number;
  itemCount: number;
}

export interface CalculationOptions {
  taxPercent?: number;
  tipPercent?: number;
  discount?: number;
}

export interface EditableItemsTableProps {
  initialItems?: ReceiptItem[];
  initialTaxPercent?: number;
  initialTipPercent?: number;
  initialDiscount?: number;
  currencySymbol?: string;
  onItemsChange?: (items: ReceiptItem[], totals: ReceiptTotals) => void;
  onSave?: (items: ReceiptItem[], totals: ReceiptTotals) => void;
  readOnly?: boolean;
  title?: string;
}
