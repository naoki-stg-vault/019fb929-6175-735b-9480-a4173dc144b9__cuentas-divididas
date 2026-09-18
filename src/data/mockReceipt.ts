import { ReceiptItem } from "@/types/item";

export const SAMPLE_OCR_ITEMS: ReceiptItem[] = [
  {
    id: "ocr_1",
    description: "Hamburguesa Doble Cheddar",
    quantity: 2,
    unitPrice: 8500,
    totalPrice: 17000,
    category: "Comida",
    confidence: 0.98,
  },
  {
    id: "ocr_2",
    description: "Papas Fritas Rusticas c/ Bacon",
    quantity: 1,
    unitPrice: 4200,
    totalPrice: 4200,
    category: "Entrada",
    confidence: 0.95,
  },
  {
    id: "ocr_3",
    description: "Cerveza IPA Patagonia 500ml",
    quantity: 3,
    unitPrice: 3200,
    totalPrice: 9600,
    category: "Bebida",
    confidence: 0.92,
  },
  {
    id: "ocr_4",
    description: "Agua Mineral sin gas 500ml",
    quantity: 1,
    unitPrice: 1800,
    totalPrice: 1800,
    category: "Bebida",
    confidence: 0.99,
  },
  {
    id: "ocr_5",
    description: "Flan casero c/ dulce de leche (dudoso)",
    quantity: 1,
    unitPrice: 3500,
    totalPrice: 3500,
    category: "Postre",
    confidence: 0.62, // Low confidence: trigger OCR warning
  },
];

export const ALTERNATIVE_RECEIPT_ITEMS: ReceiptItem[] = [
  {
    id: "alt_1",
    description: "Pizza Napolitana Familiar",
    quantity: 1,
    unitPrice: 12500,
    totalPrice: 12500,
    category: "Comida",
    confidence: 0.97,
  },
  {
    id: "alt_2",
    description: "Gaseosa Cola 1.5L",
    quantity: 2,
    unitPrice: 2800,
    totalPrice: 5600,
    category: "Bebida",
    confidence: 0.94,
  },
  {
    id: "alt_3",
    description: "Empanadas de Carne Cortada a Cuchillo",
    quantity: 4,
    unitPrice: 1600,
    totalPrice: 6400,
    category: "Entrada",
    confidence: 0.58, // Low confidence
  },
];
