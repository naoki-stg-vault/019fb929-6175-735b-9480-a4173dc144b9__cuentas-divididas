import {
  ItemAssignment,
  ItemAssignmentStatus,
  ItemAssignmentSummary,
  ItemSplitResult,
  ParticipantSummary,
  SplitMode,
} from "@/types/assignment";
import { Participant } from "@/types/participant";
import { roundCurrency } from "./calculations";

/**
 * Splits an amount equally across an array of participant IDs.
 * Distributes fractional cents one by one to ensure the sum matches totalAmount exactly.
 */
export function splitEqual(
  totalAmount: number,
  participantIds: string[]
): ItemSplitResult[] {
  if (!participantIds || participantIds.length === 0 || totalAmount <= 0) {
    return [];
  }

  const count = participantIds.length;
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;

  return participantIds.map((participantId, idx) => {
    const centsForParticipant = baseCents + (idx < remainderCents ? 1 : 0);
    const amount = centsForParticipant / 100;
    const percentage = totalCents > 0
      ? Number(((centsForParticipant / totalCents) * 100).toFixed(1))
      : 0;

    return {
      participantId,
      amount,
      percentage,
      share: 1,
    };
  });
}

/**
 * Splits an amount proportionally according to custom shares (cuotas/partes).
 * Uses largest remainder method (Hare-Niemeyer) to distribute cent differences.
 */
export function splitByShares(
  totalAmount: number,
  shares: Array<{ participantId: string; share: number }>
): ItemSplitResult[] {
  if (!shares || shares.length === 0 || totalAmount <= 0) {
    return [];
  }

  const validShares = shares.filter((s) => s.share > 0);
  if (validShares.length === 0) {
    return [];
  }

  const totalShares = validShares.reduce((acc, s) => acc + s.share, 0);
  const totalCents = Math.round(totalAmount * 100);

  // Calculate raw cents and floor cents per participant
  const allocations = validShares.map((s, index) => {
    const exactCents = (totalCents * s.share) / totalShares;
    const floorCents = Math.floor(exactCents);
    const remainder = exactCents - floorCents;
    return {
      index,
      participantId: s.participantId,
      share: s.share,
      floorCents,
      remainder,
      cents: floorCents,
    };
  });

  const allocatedCents = allocations.reduce((acc, a) => acc + a.floorCents, 0);
  let centsToDistribute = totalCents - allocatedCents;

  // Sort by remainder descending to give leftover cents to those with largest fraction
  const sortedByRemainder = [...allocations].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index
  );

  for (let i = 0; i < centsToDistribute && i < sortedByRemainder.length; i++) {
    sortedByRemainder[i].cents += 1;
  }

  return allocations.map((a) => {
    const amount = a.cents / 100;
    const percentage = totalCents > 0
      ? Number(((a.cents / totalCents) * 100).toFixed(1))
      : 0;

    return {
      participantId: a.participantId,
      amount,
      percentage,
      share: a.share,
    };
  });
}

/**
 * Splits an amount according to explicit custom amounts.
 */
export function splitByCustomAmounts(
  totalAmount: number,
  customAmounts: Array<{ participantId: string; customAmount: number }>
): ItemSplitResult[] {
  if (!customAmounts || customAmounts.length === 0) {
    return [];
  }

  return customAmounts.map((ca) => {
    const amount = roundCurrency(ca.customAmount || 0);
    const percentage = totalAmount > 0
      ? Number(((amount / totalAmount) * 100).toFixed(1))
      : 0;

    return {
      participantId: ca.participantId,
      amount,
      percentage,
    };
  });
}

/**
 * Computes split details for a single item based on its assignment mode.
 */
export function calculateItemSplit(
  totalPrice: number,
  assignment?: ItemAssignment
): ItemSplitResult[] {
  if (!assignment || !assignment.participants || assignment.participants.length === 0) {
    return [];
  }

  const { splitMode, participants } = assignment;

  if (splitMode === "EQUAL") {
    return splitEqual(
      totalPrice,
      participants.map((p) => p.participantId)
    );
  }

  if (splitMode === "CUSTOM_SHARES") {
    return splitByShares(
      totalPrice,
      participants.map((p) => ({
        participantId: p.participantId,
        share: p.share !== undefined && p.share > 0 ? p.share : 1,
      }))
    );
  }

  if (splitMode === "CUSTOM_AMOUNT") {
    return splitByCustomAmounts(
      totalPrice,
      participants.map((p) => ({
        participantId: p.participantId,
        customAmount: p.customAmount ?? 0,
      }))
    );
  }

  return [];
}

/**
 * Calculates a complete summary for an item's assignment, including status and remaining delta.
 */
export function getItemAssignmentSummary(
  itemId: string,
  totalPrice: number,
  assignment?: ItemAssignment
): ItemAssignmentSummary {
  const roundedTotal = roundCurrency(totalPrice);

  if (!assignment || !assignment.participants || assignment.participants.length === 0) {
    return {
      itemId,
      status: "unassigned",
      totalPrice: roundedTotal,
      assignedAmount: 0,
      remainingAmount: roundedTotal,
      splits: [],
    };
  }

  const splits = calculateItemSplit(roundedTotal, assignment);
  const assignedAmount = roundCurrency(
    splits.reduce((acc, s) => acc + s.amount, 0)
  );
  const remainingAmount = roundCurrency(Math.max(0, roundedTotal - assignedAmount));

  let status: ItemAssignmentStatus = "unassigned";

  if (assignment.splitMode === "EQUAL" || assignment.splitMode === "CUSTOM_SHARES") {
    status = splits.length > 0 ? "assigned" : "unassigned";
  } else if (assignment.splitMode === "CUSTOM_AMOUNT") {
    const diff = Math.abs(roundedTotal - assignedAmount);
    if (assignedAmount === 0) {
      status = "unassigned";
    } else if (diff < 0.01) {
      status = "assigned";
    } else {
      status = "partial";
    }
  }

  return {
    itemId,
    status,
    totalPrice: roundedTotal,
    assignedAmount,
    remainingAmount,
    splits,
  };
}

/**
 * Calculates subtotals and assigned items count aggregated by participant.
 */
export function calculateParticipantSummaries(
  items: Array<{ id: string; totalPrice: number }>,
  assignments: Record<string, ItemAssignment>,
  participants: Participant[]
): ParticipantSummary[] {
  const map = new Map<string, { subtotal: number; itemIds: Set<string> }>();

  for (const p of participants) {
    map.set(p.id, { subtotal: 0, itemIds: new Set<string>() });
  }

  for (const item of items) {
    const assignment = assignments[item.id];
    if (!assignment) continue;

    const splits = calculateItemSplit(item.totalPrice, assignment);
    for (const split of splits) {
      const current = map.get(split.participantId);
      if (current) {
        current.subtotal += split.amount;
        if (split.amount > 0) {
          current.itemIds.add(item.id);
        }
      } else {
        map.set(split.participantId, {
          subtotal: split.amount,
          itemIds: new Set(split.amount > 0 ? [item.id] : []),
        });
      }
    }
  }

  return participants.map((p) => {
    const entry = map.get(p.id) || { subtotal: 0, itemIds: new Set() };
    return {
      participantId: p.id,
      participantName: p.name,
      color: p.color,
      avatar: p.avatar,
      subtotal: roundCurrency(entry.subtotal),
      itemCount: entry.itemIds.size,
      assignedItemIds: Array.from(entry.itemIds),
    };
  });
}

/**
 * Progress overview of assignments across all items.
 */
export function getAssignmentProgress(
  items: Array<{ id: string; totalPrice: number }>,
  assignments: Record<string, ItemAssignment>
): {
  totalItems: number;
  assignedItems: number;
  unassignedItems: number;
  partialItems: number;
  totalReceiptAmount: number;
  assignedReceiptAmount: number;
  progressPercentage: number;
  isComplete: boolean;
} {
  const totalItems = items.length;
  if (totalItems === 0) {
    return {
      totalItems: 0,
      assignedItems: 0,
      unassignedItems: 0,
      partialItems: 0,
      totalReceiptAmount: 0,
      assignedReceiptAmount: 0,
      progressPercentage: 100,
      isComplete: true,
    };
  }

  let assignedItems = 0;
  let unassignedItems = 0;
  let partialItems = 0;
  let totalReceiptAmount = 0;
  let assignedReceiptAmount = 0;

  for (const item of items) {
    totalReceiptAmount += item.totalPrice;
    const summary = getItemAssignmentSummary(item.id, item.totalPrice, assignments[item.id]);

    assignedReceiptAmount += summary.assignedAmount;

    if (summary.status === "assigned") {
      assignedItems++;
    } else if (summary.status === "partial") {
      partialItems++;
    } else {
      unassignedItems++;
    }
  }

  const roundedTotal = roundCurrency(totalReceiptAmount);
  const roundedAssigned = roundCurrency(assignedReceiptAmount);
  const progressPercentage = roundedTotal > 0
    ? Math.min(100, Math.round((roundedAssigned / roundedTotal) * 100))
    : assignedItems === totalItems ? 100 : 0;

  const isComplete = assignedItems === totalItems && partialItems === 0;

  return {
    totalItems,
    assignedItems,
    unassignedItems,
    partialItems,
    totalReceiptAmount: roundedTotal,
    assignedReceiptAmount: roundedAssigned,
    progressPercentage,
    isComplete,
  };
}
