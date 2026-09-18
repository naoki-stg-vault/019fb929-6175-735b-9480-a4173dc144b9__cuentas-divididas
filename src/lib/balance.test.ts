import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBalances,
  calculateItemBreakdown,
  calculateBalanceSummary,
  roundToTwo,
  settleDebts,
} from './balance';
import { Participant, Receipt, ReceiptItem } from '@/types/balance';

test('roundToTwo rounds decimals correctly', () => {
  assert.equal(roundToTwo(10.005), 10.01);
  assert.equal(roundToTwo(10.004), 10);
  assert.equal(roundToTwo(0.1 + 0.2), 0.3);
});

test('calculateItemBreakdown splits equally with cent residual resolution', () => {
  const participants: Participant[] = [
    { id: 'p1', name: 'Ana' },
    { id: 'p2', name: 'Bernardo' },
    { id: 'p3', name: 'Carlos' },
  ];

  const item: ReceiptItem = {
    id: 'item1',
    name: 'Pizza Familiar',
    price: 10.0,
    quantity: 1,
    assignedTo: ['p1', 'p2', 'p3'],
  };

  const breakdown = calculateItemBreakdown(item, participants);

  // Sum must equal 10.00 exactly
  const sum = roundToTwo(breakdown.p1 + breakdown.p2 + breakdown.p3);
  assert.equal(sum, 10.0);

  // Each should have received around 3.33 or 3.34
  assert.ok(breakdown.p1 === 3.33 || breakdown.p1 === 3.34);
  assert.ok(breakdown.p2 === 3.33 || breakdown.p2 === 3.34);
  assert.ok(breakdown.p3 === 3.33 || breakdown.p3 === 3.34);
});

test('calculateItemBreakdown handles custom amounts and shares', () => {
  const participants: Participant[] = [
    { id: 'p1', name: 'Ana' },
    { id: 'p2', name: 'Bernardo' },
    { id: 'p3', name: 'Carlos' },
  ];

  const item: ReceiptItem = {
    id: 'item1',
    name: 'Vino y Cerveza',
    price: 25.0,
    quantity: 1,
    assignedTo: [
      { participantId: 'p1', customAmount: 5.0 }, // Ana fixed 5.00
      { participantId: 'p2', shares: 1 }, // Bernardo 1 share of remaining 20.00
      { participantId: 'p3', shares: 1 }, // Carlos 1 share of remaining 20.00
    ],
  };

  const breakdown = calculateItemBreakdown(item, participants);
  assert.equal(breakdown.p1, 5.0);
  assert.equal(breakdown.p2, 10.0);
  assert.equal(breakdown.p3, 10.0);
  assert.equal(breakdown.p1 + breakdown.p2 + breakdown.p3, 25.0);
});

test('calculateBalances with single payer, tax, and tip', () => {
  const receipt: Receipt = {
    id: 'r1',
    title: 'Cena Amigos',
    date: '2026-09-18',
    currency: '$',
    participants: [
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Bernardo' },
    ],
    items: [
      { id: 'i1', name: 'Burger Ana', price: 10.0, assignedTo: ['p1'] },
      { id: 'i2', name: 'Pasta Bernardo', price: 20.0, assignedTo: ['p2'] },
    ],
    // Total subtotal = 30.00. Ana 10 (1/3), Bernardo 20 (2/3)
    tip: 3.0, // Ana 1.00, Bernardo 2.00
    tax: 1.5, // Ana 0.50, Bernardo 1.00
    payers: [
      { participantId: 'p1', amount: 34.5 }, // Ana paid the entire bill
    ],
  };

  const balances = calculateBalances(receipt);
  const ana = balances.find((b) => b.participantId === 'p1')!;
  const bernardo = balances.find((b) => b.participantId === 'p2')!;

  assert.equal(ana.consumedAmount, 10.0);
  assert.equal(ana.tipAmount, 1.0);
  assert.equal(ana.taxAmount, 0.5);
  assert.equal(ana.totalOwed, 11.5);
  assert.equal(ana.paidAmount, 34.5);
  assert.equal(ana.netBalance, 23.0); // Ana is owed 23.00

  assert.equal(bernardo.consumedAmount, 20.0);
  assert.equal(bernardo.tipAmount, 2.0);
  assert.equal(bernardo.taxAmount, 1.0);
  assert.equal(bernardo.totalOwed, 23.0);
  assert.equal(bernardo.paidAmount, 0);
  assert.equal(bernardo.netBalance, -23.0); // Bernardo owes 23.00

  // Net balances must sum to 0
  assert.equal(roundToTwo(ana.netBalance + bernardo.netBalance), 0);
});

test('settleDebts produces minimal transfers and preserves status', () => {
  const balances = [
    {
      participantId: 'p1',
      participantName: 'Ana',
      consumedAmount: 20,
      tipAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalOwed: 20,
      paidAmount: 60,
      netBalance: 40, // Ana needs to receive $40
    },
    {
      participantId: 'p2',
      participantName: 'Bernardo',
      consumedAmount: 20,
      tipAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalOwed: 20,
      paidAmount: 0,
      netBalance: -20, // Bernardo owes $20
    },
    {
      participantId: 'p3',
      participantName: 'Carlos',
      consumedAmount: 20,
      tipAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalOwed: 20,
      paidAmount: 0,
      netBalance: -20, // Carlos owes $20
    },
  ];

  const statuses = {
    settle_p2_p1: 'PAID' as const,
  };

  const settlements = settleDebts(balances, statuses);

  assert.equal(settlements.length, 2);

  const s1 = settlements.find((s) => s.fromParticipantId === 'p2' && s.toParticipantId === 'p1');
  const s2 = settlements.find((s) => s.fromParticipantId === 'p3' && s.toParticipantId === 'p1');

  assert.ok(s1);
  assert.equal(s1.amount, 20);
  assert.equal(s1.status, 'PAID'); // Preserved from statuses

  assert.ok(s2);
  assert.equal(s2.amount, 20);
  assert.equal(s2.status, 'PENDING'); // Default status
});

test('calculateBalanceSummary computes full metrics', () => {
  const receipt: Receipt = {
    id: 'r_summary',
    title: 'Almuerzo de Trabajo',
    date: '2026-09-18',
    currency: '$',
    participants: [
      { id: 'u1', name: 'Lucía' },
      { id: 'u2', name: 'Martín' },
      { id: 'u3', name: 'Sofía' },
    ],
    items: [
      { id: 'it1', name: 'Plato 1', price: 15, assignedTo: ['u1'] },
      { id: 'it2', name: 'Plato 2', price: 20, assignedTo: ['u2'] },
      { id: 'it3', name: 'Plato 3', price: 25, assignedTo: ['u3'] },
    ],
    payers: [{ participantId: 'u1', amount: 60 }],
    settlementStatuses: {
      settle_u2_u1: 'PAID',
    },
  };

  const summary = calculateBalanceSummary(receipt);

  assert.equal(summary.subtotal, 60);
  assert.equal(summary.grandTotal, 60);
  assert.equal(summary.totalPaid, 60);
  assert.equal(summary.balances.length, 3);
  assert.equal(summary.settlements.length, 2);
  assert.equal(summary.settledCount, 1);
  assert.equal(summary.totalSettlementsCount, 2);
  assert.equal(summary.isFullySettled, false);
});
