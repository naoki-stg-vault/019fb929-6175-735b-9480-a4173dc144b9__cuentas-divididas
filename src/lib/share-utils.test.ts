import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShareableText,
  formatCurrency,
  getShareableLink,
  getWhatsAppShareUrl,
} from './share-utils';
import { BalanceSummary, Receipt } from '@/types/balance';

const mockReceipt: Receipt = {
  id: 'rec_123',
  title: 'Cena Cumpleaños',
  date: '2026-09-18',
  currency: '$',
  participants: [
    { id: 'p1', name: 'Laura' },
    { id: 'p2', name: 'Diego' },
  ],
  items: [
    { id: 'i1', name: 'Hamburguesa', price: 15, quantity: 1, assignedTo: ['p1'] },
    { id: 'i2', name: 'Sushi Combo', price: 25, quantity: 1, assignedTo: ['p2'] },
  ],
  payers: [{ participantId: 'p1', amount: 44 }],
  tip: 4,
  tax: 0,
};

const mockSummary: BalanceSummary = {
  currency: '$',
  subtotal: 40,
  tax: 0,
  tip: 4,
  discount: 0,
  grandTotal: 44,
  totalPaid: 44,
  balances: [
    {
      participantId: 'p1',
      participantName: 'Laura',
      consumedAmount: 15,
      tipAmount: 1.5,
      taxAmount: 0,
      discountAmount: 0,
      totalOwed: 16.5,
      paidAmount: 44,
      netBalance: 27.5,
    },
    {
      participantId: 'p2',
      participantName: 'Diego',
      consumedAmount: 25,
      tipAmount: 2.5,
      taxAmount: 0,
      discountAmount: 0,
      totalOwed: 27.5,
      paidAmount: 0,
      netBalance: -27.5,
    },
  ],
  settlements: [
    {
      id: 'settle_p2_p1',
      fromParticipantId: 'p2',
      fromParticipantName: 'Diego',
      toParticipantId: 'p1',
      toParticipantName: 'Laura',
      amount: 27.5,
      status: 'PENDING',
    },
  ],
  isFullySettled: false,
  settledCount: 0,
  totalSettlementsCount: 1,
};

test('formatCurrency formats positive, negative and zero amounts', () => {
  assert.equal(formatCurrency(12.5), '$12.50');
  assert.equal(formatCurrency(-8), '-$8.00');
  assert.equal(formatCurrency(0, '€'), '€0.00');
});

test('buildShareableText includes titles, totals, breakdown, and settlements', () => {
  const text = buildShareableText(mockReceipt, mockSummary, {
    shareUrl: 'https://app.cuentas.com/receipts/rec_123',
    includeItemsBreakdown: true,
  });

  assert.ok(text.includes('Cena Cumpleaños'));
  assert.ok(text.includes('Subtotal: $40.00'));
  assert.ok(text.includes('Propina: $4.00'));
  assert.ok(text.includes('Total General: $44.00'));
  assert.ok(text.includes('Laura'));
  assert.ok(text.includes('Diego'));
  assert.ok(text.includes('Diego* paga *$27.50* a *Laura* ⏳ [PENDIENTE]'));
  assert.ok(text.includes('Hamburguesa'));
  assert.ok(text.includes('https://app.cuentas.com/receipts/rec_123'));
});

test('buildShareableText reflects paid status when updated', () => {
  const paidSummary: BalanceSummary = {
    ...mockSummary,
    settlements: [
      {
        ...mockSummary.settlements[0],
        status: 'PAID',
      },
    ],
  };

  const text = buildShareableText(mockReceipt, paidSummary);
  assert.ok(text.includes('Diego* paga *$27.50* a *Laura* ✅ [PAGADO]'));
});

test('getWhatsAppShareUrl creates valid WhatsApp url', () => {
  const url = getWhatsAppShareUrl('Hola mundo!', '+123456789');
  assert.ok(url.startsWith('https://wa.me/123456789?text='));
  assert.ok(url.includes('Hola%20mundo!'));

  const urlNoPhone = getWhatsAppShareUrl('Texto general');
  assert.ok(urlNoPhone.startsWith('https://api.whatsapp.com/send?text='));
});

test('getShareableLink builds proper link with or without origin', () => {
  assert.equal(
    getShareableLink('rec_123', 'https://example.com'),
    'https://example.com/receipts/rec_123'
  );
  assert.equal(getShareableLink('rec_123'), '/receipts/rec_123');
});
