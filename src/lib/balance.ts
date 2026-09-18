import {
  BalanceSummary,
  ItemAssignment,
  Participant,
  ParticipantBalance,
  PaymentStatus,
  Receipt,
  ReceiptItem,
  Settlement,
} from '@/types/balance';

/**
 * Rounds a number to two decimal places safely.
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Converts a float amount to integer cents.
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to float amount.
 */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Normalizes item assignments into a uniform ItemAssignment array.
 */
export function normalizeAssignments(
  assignments: (string | ItemAssignment)[]
): ItemAssignment[] {
  return assignments.map((a) => {
    if (typeof a === 'string') {
      return { participantId: a, shares: 1 };
    }
    return {
      participantId: a.participantId,
      shares: a.shares ?? (a.customAmount !== undefined ? 0 : 1),
      customAmount: a.customAmount,
    };
  });
}

/**
 * Distributes integer cents residual so that the sum of parts exactly equals totalCents.
 */
function distributeResidualCents(
  centsList: { id: string; amount: number; raw: number }[],
  targetTotalCents: number
): { id: string; amount: number }[] {
  const currentTotal = centsList.reduce((acc, curr) => acc + curr.amount, 0);
  let diff = targetTotalCents - currentTotal;

  if (diff === 0 || centsList.length === 0) {
    return centsList.map((c) => ({ id: c.id, amount: c.amount }));
  }

  // Sort by highest remainder/fractional part descending if diff > 0, or ascending if diff < 0
  const sorted = [...centsList].sort((a, b) => {
    const fracA = a.raw - Math.floor(a.raw);
    const fracB = b.raw - Math.floor(b.raw);
    return diff > 0 ? fracB - fracA : fracA - fracB;
  });

  const adjustmentMap = new Map<string, number>();
  for (let i = 0; i < sorted.length && diff !== 0; i++) {
    const item = sorted[i];
    const step = diff > 0 ? 1 : -1;
    adjustmentMap.set(item.id, (adjustmentMap.get(item.id) ?? 0) + step);
    diff -= step;
    if (i === sorted.length - 1 && diff !== 0) {
      i = -1; // loop again if needed
    }
  }

  return centsList.map((c) => ({
    id: c.id,
    amount: c.amount + (adjustmentMap.get(c.id) ?? 0),
  }));
}

/**
 * Calculates how much each participant consumed from an individual receipt item.
 * Guarantees exact sum matching the item total price.
 */
export function calculateItemBreakdown(
  item: ReceiptItem,
  allParticipants: Participant[]
): Record<string, number> {
  const itemTotal = roundToTwo(item.price * (item.quantity ?? 1));
  const totalCents = toCents(itemTotal);
  const result: Record<string, number> = {};

  // Initialize all participants to 0
  for (const p of allParticipants) {
    result[p.id] = 0;
  }

  if (!item.assignedTo || item.assignedTo.length === 0) {
    return result;
  }

  const normalized = normalizeAssignments(item.assignedTo);
  let customCentsTotal = 0;
  let remainingShares = 0;

  for (const assign of normalized) {
    if (assign.customAmount !== undefined) {
      customCentsTotal += toCents(assign.customAmount);
    } else {
      remainingShares += assign.shares ?? 1;
    }
  }

  const centsToDistribute = Math.max(0, totalCents - customCentsTotal);
  const intermediate: { id: string; amount: number; raw: number }[] = [];

  for (const assign of normalized) {
    if (assign.customAmount !== undefined) {
      const customCents = toCents(assign.customAmount);
      result[assign.participantId] = (result[assign.participantId] ?? 0) + fromCents(customCents);
    } else if (remainingShares > 0) {
      const shares = assign.shares ?? 1;
      const rawCents = (centsToDistribute * shares) / remainingShares;
      const roundedCents = Math.round(rawCents);
      intermediate.push({
        id: assign.participantId,
        amount: roundedCents,
        raw: rawCents,
      });
    }
  }

  if (intermediate.length > 0) {
    const adjusted = distributeResidualCents(intermediate, centsToDistribute);
    for (const itemAdj of adjusted) {
      result[itemAdj.id] = (result[itemAdj.id] ?? 0) + fromCents(itemAdj.amount);
    }
  }

  return result;
}

/**
 * Calculates individual balances for all participants including proportional tips, taxes,
 * discounts, and upfront payments.
 */
export function calculateBalances(receipt: Receipt): ParticipantBalance[] {
  const { participants, items, payers = [], tip = 0, tax = 0, discount = 0 } = receipt;

  // 1. Calculate consumption per participant
  const consumptionCentsMap = new Map<string, number>();
  for (const p of participants) {
    consumptionCentsMap.set(p.id, 0);
  }

  for (const item of items) {
    const breakdown = calculateItemBreakdown(item, participants);
    for (const [pId, amount] of Object.entries(breakdown)) {
      const current = consumptionCentsMap.get(pId) ?? 0;
      consumptionCentsMap.set(pId, current + toCents(amount));
    }
  }

  const subtotalCents = Array.from(consumptionCentsMap.values()).reduce((a, b) => a + b, 0);
  const taxCents = toCents(tax);
  const tipCents = toCents(tip);
  const discountCents = toCents(discount);

  // 2. Proportional extras distribution
  const taxRawList: { id: string; amount: number; raw: number }[] = [];
  const tipRawList: { id: string; amount: number; raw: number }[] = [];
  const discountRawList: { id: string; amount: number; raw: number }[] = [];

  for (const p of participants) {
    const pConsumedCents = consumptionCentsMap.get(p.id) ?? 0;
    const ratio = subtotalCents > 0 ? pConsumedCents / subtotalCents : 1 / participants.length;

    const rawTax = taxCents * ratio;
    const rawTip = tipCents * ratio;
    const rawDiscount = discountCents * ratio;

    taxRawList.push({ id: p.id, amount: Math.round(rawTax), raw: rawTax });
    tipRawList.push({ id: p.id, amount: Math.round(rawTip), raw: rawTip });
    discountRawList.push({ id: p.id, amount: Math.round(rawDiscount), raw: rawDiscount });
  }

  const adjustedTax = distributeResidualCents(taxRawList, taxCents);
  const adjustedTip = distributeResidualCents(tipRawList, tipCents);
  const adjustedDiscount = distributeResidualCents(discountRawList, discountCents);

  const taxMap = new Map(adjustedTax.map((t) => [t.id, t.amount]));
  const tipMap = new Map(adjustedTip.map((t) => [t.id, t.amount]));
  const discountMap = new Map(adjustedDiscount.map((d) => [d.id, d.amount]));

  // 3. Upfront paid map
  const paidCentsMap = new Map<string, number>();
  for (const p of participants) {
    paidCentsMap.set(p.id, 0);
  }
  for (const payer of payers) {
    const current = paidCentsMap.get(payer.participantId) ?? 0;
    paidCentsMap.set(payer.participantId, current + toCents(payer.amount));
  }

  // 4. Build ParticipantBalance list
  const balances: ParticipantBalance[] = participants.map((p) => {
    const consumedCents = consumptionCentsMap.get(p.id) ?? 0;
    const pTaxCents = taxMap.get(p.id) ?? 0;
    const pTipCents = tipMap.get(p.id) ?? 0;
    const pDiscountCents = discountMap.get(p.id) ?? 0;
    const pPaidCents = paidCentsMap.get(p.id) ?? 0;

    const owedCents = consumedCents + pTaxCents + pTipCents - pDiscountCents;
    const netCents = pPaidCents - owedCents;

    return {
      participantId: p.id,
      participantName: p.name,
      participantColor: p.color,
      consumedAmount: fromCents(consumedCents),
      tipAmount: fromCents(pTipCents),
      taxAmount: fromCents(pTaxCents),
      discountAmount: fromCents(pDiscountCents),
      totalOwed: fromCents(owedCents),
      paidAmount: fromCents(pPaidCents),
      netBalance: fromCents(netCents),
    };
  });

  return balances;
}

/**
 * Simplifies debts among participants to minimize transactions ("Quién paga a quién").
 * Uses a greedy matching algorithm: largest debtor pays largest creditor.
 */
export function settleDebts(
  balances: ParticipantBalance[],
  settlementStatuses: Record<string, PaymentStatus> = {}
): Settlement[] {
  // Work with integer cents to prevent floating point inaccuracies
  interface ParticipantNode {
    id: string;
    name: string;
    cents: number;
  }

  const debtors: ParticipantNode[] = [];
  const creditors: ParticipantNode[] = [];

  for (const b of balances) {
    const cents = toCents(b.netBalance);
    if (cents < 0) {
      debtors.push({ id: b.participantId, name: b.participantName, cents: Math.abs(cents) });
    } else if (cents > 0) {
      creditors.push({ id: b.participantId, name: b.participantName, cents });
    }
  }

  // Invariant check: sum(debtors) should equal sum(creditors)
  const totalDebt = debtors.reduce((acc, d) => acc + d.cents, 0);
  const totalCredit = creditors.reduce((acc, c) => acc + c.cents, 0);

  // If there is any 1-cent residual mismatch due to rounding, adjust the largest creditor/debtor
  if (totalDebt !== totalCredit && debtors.length > 0 && creditors.length > 0) {
    const diff = totalDebt - totalCredit;
    if (diff > 0) {
      // Debtors owe slightly more than creditors receive, add to largest creditor
      creditors.sort((a, b) => b.cents - a.cents);
      creditors[0].cents += diff;
    } else {
      // Creditors expect slightly more than debtors owe, add to largest debtor
      debtors.sort((a, b) => b.cents - a.cents);
      debtors[0].cents += Math.abs(diff);
    }
  }

  // Sort descending by amount to greedily pair largest transactions
  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const transferCents = Math.min(debtor.cents, creditor.cents);
    if (transferCents > 0) {
      const settlementId = `settle_${debtor.id}_${creditor.id}`;
      const status = settlementStatuses[settlementId] ?? 'PENDING';

      settlements.push({
        id: settlementId,
        fromParticipantId: debtor.id,
        fromParticipantName: debtor.name,
        toParticipantId: creditor.id,
        toParticipantName: creditor.name,
        amount: fromCents(transferCents),
        status,
      });

      debtor.cents -= transferCents;
      creditor.cents -= transferCents;
    }

    if (debtor.cents === 0) {
      debtorIndex++;
    }
    if (creditor.cents === 0) {
      creditorIndex++;
    }
  }

  return settlements;
}

/**
 * Calculates complete balance summary for a receipt.
 */
export function calculateBalanceSummary(receipt: Receipt): BalanceSummary {
  const balances = calculateBalances(receipt);
  const settlements = settleDebts(balances, receipt.settlementStatuses ?? {});

  const subtotal = roundToTwo(
    receipt.items.reduce((acc, it) => acc + it.price * (it.quantity ?? 1), 0)
  );
  const tax = roundToTwo(receipt.tax ?? 0);
  const tip = roundToTwo(receipt.tip ?? 0);
  const discount = roundToTwo(receipt.discount ?? 0);
  const grandTotal = roundToTwo(subtotal + tax + tip - discount);

  const totalPaid = roundToTwo(
    (receipt.payers ?? []).reduce((acc, p) => acc + p.amount, 0)
  );

  const settledCount = settlements.filter((s) => s.status === 'PAID').length;
  const isFullySettled =
    settlements.length > 0 && settlements.every((s) => s.status === 'PAID');

  return {
    currency: receipt.currency || '$',
    subtotal,
    tax,
    tip,
    discount,
    grandTotal,
    totalPaid,
    balances,
    settlements,
    isFullySettled,
    settledCount,
    totalSettlementsCount: settlements.length,
  };
}
