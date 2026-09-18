import test from "node:test";
import assert from "node:assert/strict";
import {
  roundCurrency,
  parseNumber,
  calculateItemTotal,
  calculateTotals,
  formatCurrency,
  validateReceiptItem,
} from "./calculations.js";
import { ReceiptItem } from "../types/item.js";

test("roundCurrency rounds to two decimal places accurately", () => {
  assert.equal(roundCurrency(10.555), 10.56);
  assert.equal(roundCurrency(10.554), 10.55);
  assert.equal(roundCurrency(1.005), 1.01);
  assert.equal(roundCurrency(0), 0);
  assert.equal(roundCurrency(NaN), 0);
});

test("parseNumber handles commas and periods", () => {
  assert.equal(parseNumber("12.50"), 12.5);
  assert.equal(parseNumber("12,50"), 12.5);
  assert.equal(parseNumber(" 100 "), 100);
  assert.equal(parseNumber("invalid", 5), 5);
  assert.equal(parseNumber(42), 42);
});

test("calculateItemTotal computes quantity * unitPrice rounded", () => {
  assert.equal(calculateItemTotal(2, 4.5), 9.0);
  assert.equal(calculateItemTotal(3, 3.333), 10.0);
  assert.equal(calculateItemTotal(0, 10), 0);
  assert.equal(calculateItemTotal(-2, 10), 0);
});

test("calculateTotals computes subtotal, tax, tip and grand total", () => {
  const items: ReceiptItem[] = [
    { id: "1", description: "Burger", quantity: 2, unitPrice: 500, totalPrice: 1000 },
    { id: "2", description: "Fries", quantity: 1, unitPrice: 250, totalPrice: 250 },
  ];

  // Subtotal = 1250, itemCount = 3
  const res = calculateTotals(items, { taxPercent: 10, tipPercent: 10, discount: 50 });
  assert.equal(res.subtotal, 1250);
  assert.equal(res.discount, 50);
  // Taxable base = 1200, 10% = 120
  assert.equal(res.taxAmount, 120);
  // Tip on 1250: 10% = 125
  assert.equal(res.tipAmount, 125);
  // Total = 1200 + 120 + 125 = 1445
  assert.equal(res.total, 1445);
  assert.equal(res.itemCount, 3);
});

test("validateReceiptItem checks for required fields and positive values", () => {
  assert.equal(validateReceiptItem({ description: "Pizza", quantity: 1, unitPrice: 10 }).valid, true);
  assert.equal(validateReceiptItem({ description: "", quantity: 1, unitPrice: 10 }).valid, false);
  assert.equal(validateReceiptItem({ description: "Pizza", quantity: 0, unitPrice: 10 }).valid, false);
  assert.equal(validateReceiptItem({ description: "Pizza", quantity: 1, unitPrice: -5 }).valid, false);
});
