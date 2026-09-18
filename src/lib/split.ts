import { ItemSplitDetail, ParticipantSplit, Receipt, Split } from '../types/receipt';

/**
 * Calculates itemized split, prorated taxes and tips, and total balances per participant.
 */
export function calculateSplit(
  receipt: Pick<Receipt, 'items' | 'participants' | 'subtotal' | 'tax' | 'tip' | 'total'>
): Split {
  const { items, participants, tax = 0, tip = 0 } = receipt;
  const subtotal = receipt.subtotal > 0
    ? receipt.subtotal
    : items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);

  const itemDetails: ItemSplitDetail[] = [];
  const participantSubtotals = new Map<string, number>();

  // Initialize subtotals for all known participants
  for (const p of participants) {
    participantSubtotals.set(p.id, 0);
  }

  // Calculate per-item shares
  for (const item of items) {
    const assignedIds = item.assignedParticipantIds && item.assignedParticipantIds.length > 0
      ? item.assignedParticipantIds
      : participants.map((p) => p.id); // Default to all if none explicitly assigned

    if (assignedIds.length === 0) continue;

    const share = item.totalPrice / assignedIds.length;
    const itemTax = subtotal > 0 ? (item.totalPrice / subtotal) * tax : 0;
    const itemTip = subtotal > 0 ? (item.totalPrice / subtotal) * tip : 0;

    const shareTax = itemTax / assignedIds.length;
    const shareTip = itemTip / assignedIds.length;

    for (const pId of assignedIds) {
      const prevSubtotal = participantSubtotals.get(pId) ?? 0;
      participantSubtotals.set(pId, prevSubtotal + share);

      itemDetails.push({
        itemId: item.id,
        itemDescription: item.description,
        participantId: pId,
        amount: Number(share.toFixed(2)),
        proportionalTax: Number(shareTax.toFixed(2)),
        proportionalTip: Number(shareTip.toFixed(2)),
        total: Number((share + shareTax + shareTip).toFixed(2)),
      });
    }
  }

  // Calculate participant splits
  const participantSplits: ParticipantSplit[] = participants.map((p) => {
    const pSubtotal = participantSubtotals.get(p.id) ?? 0;
    const pTax = subtotal > 0 ? (pSubtotal / subtotal) * tax : 0;
    const pTip = subtotal > 0 ? (pSubtotal / subtotal) * tip : 0;
    const pTotal = pSubtotal + pTax + pTip;

    return {
      participantId: p.id,
      participantName: p.name,
      subtotal: Number(pSubtotal.toFixed(2)),
      tax: Number(pTax.toFixed(2)),
      tip: Number(pTip.toFixed(2)),
      total: Number(pTotal.toFixed(2)),
      balance: Number(pTotal.toFixed(2)),
    };
  });

  const grandTotal = Number((subtotal + tax + tip).toFixed(2));

  return {
    items: itemDetails,
    participants: participantSplits,
    totalProratedTax: Number(tax.toFixed(2)),
    totalProratedTip: Number(tip.toFixed(2)),
    grandTotal,
  };
}
