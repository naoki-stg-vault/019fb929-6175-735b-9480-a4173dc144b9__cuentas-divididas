import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateItemTotal,
  calculateTotals,
  generateItemId,
} from "./calculations.js";
import { ReceiptItem } from "../types/item.js";

test("adding and recalculating items dynamically", () => {
  const initialItems: ReceiptItem[] = [
    {
      id: "1",
      description: "Empanada",
      quantity: 3,
      unitPrice: 1500,
      totalPrice: 4500,
    },
  ];

  let totals = calculateTotals(initialItems, { tipPercent: 10, taxPercent: 21 });
  assert.equal(totals.subtotal, 4500);
  assert.equal(totals.itemCount, 3);
  // Tax 21% of 4500 = 945
  assert.equal(totals.taxAmount, 945);
  // Tip 10% of 4500 = 450
  assert.equal(totals.tipAmount, 450);
  assert.equal(totals.total, 4500 + 945 + 450); // 5895

  // User adds another item
  const newItem: ReceiptItem = {
    id: generateItemId(),
    description: "Vino Malbec",
    quantity: 1,
    unitPrice: 6000,
    totalPrice: calculateItemTotal(1, 6000),
    isManuallyAdded: true,
  };

  const updatedItems = [...initialItems, newItem];
  totals = calculateTotals(updatedItems, { tipPercent: 10, taxPercent: 21 });

  assert.equal(totals.subtotal, 10500);
  assert.equal(totals.itemCount, 4);
  assert.equal(totals.taxAmount, 2205); // 21% of 10500
  assert.equal(totals.tipAmount, 1050); // 10% of 10500
  assert.equal(totals.total, 13755); // 10500 + 2205 + 1050
});

test("editing item quantity and price updates row total accurately", () => {
  const item: ReceiptItem = {
    id: "item_test",
    description: "Cerveza",
    quantity: 2,
    unitPrice: 2000,
    totalPrice: 4000,
  };

  // Modify quantity to 4
  const updatedQty = 4;
  const newRowTotal1 = calculateItemTotal(updatedQty, item.unitPrice);
  assert.equal(newRowTotal1, 8000);

  // Modify price to 2500.50
  const updatedPrice = 2500.5;
  const newRowTotal2 = calculateItemTotal(updatedQty, updatedPrice);
  assert.equal(newRowTotal2, 10002);
});

test("deleting item updates remaining totals", () => {
  const items: ReceiptItem[] = [
    { id: "1", description: "A", quantity: 1, unitPrice: 100, totalPrice: 100 },
    { id: "2", description: "B", quantity: 2, unitPrice: 200, totalPrice: 400 },
    { id: "3", description: "C", quantity: 1, unitPrice: 300, totalPrice: 300 },
  ];

  const beforeTotals = calculateTotals(items);
  assert.equal(beforeTotals.subtotal, 800);
  assert.equal(beforeTotals.itemCount, 4);

  // Delete item '2'
  const remaining = items.filter((i) => i.id !== "2");
  const afterTotals = calculateTotals(remaining);
  assert.equal(afterTotals.subtotal, 400);
  assert.equal(afterTotals.itemCount, 2);
});

test("discount reduces taxable base and total properly", () => {
  const items: ReceiptItem[] = [
    { id: "1", description: "Dinner", quantity: 1, unitPrice: 1000, totalPrice: 1000 },
  ];

  // 1000 subtotal, 200 discount => 800 base. 10% tax on 800 = 80. 10% tip on 1000 = 100.
  const totals = calculateTotals(items, { discount: 200, taxPercent: 10, tipPercent: 10 });
  assert.equal(totals.subtotal, 1000);
  assert.equal(totals.discount, 200);
  assert.equal(totals.taxAmount, 80);
  assert.equal(totals.tipAmount, 100);
  assert.equal(totals.total, 800 + 80 + 100); // 980
});
