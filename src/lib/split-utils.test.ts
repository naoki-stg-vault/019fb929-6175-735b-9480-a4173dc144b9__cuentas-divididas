import test from "node:test";
import assert from "node:assert/strict";
import {
  splitEqual,
  splitByShares,
  splitByCustomAmounts,
  calculateItemSplit,
  getItemAssignmentSummary,
  calculateParticipantSummaries,
  getAssignmentProgress,
} from "./split-utils";
import { ItemAssignment } from "../types/assignment";
import { Participant } from "../types/participant";

test("splitEqual distributes cents perfectly with no penny loss", () => {
  // $10.00 split among 3 people => 3.34, 3.33, 3.33
  const results = splitEqual(10, ["p1", "p2", "p3"]);
  assert.equal(results.length, 3);
  assert.equal(results[0].amount, 3.34);
  assert.equal(results[1].amount, 3.33);
  assert.equal(results[2].amount, 3.33);

  const sum = results.reduce((acc, r) => acc + r.amount, 0);
  assert.equal(Math.round(sum * 100) / 100, 10.00);
});

test("splitEqual handles exact divisions and single participant", () => {
  // $25.00 split among 2 people => 12.50, 12.50
  const twoResults = splitEqual(25, ["a", "b"]);
  assert.equal(twoResults[0].amount, 12.5);
  assert.equal(twoResults[1].amount, 12.5);

  // $15.99 split for 1 person => 15.99
  const single = splitEqual(15.99, ["a"]);
  assert.equal(single[0].amount, 15.99);

  // Empty list
  assert.deepEqual(splitEqual(10, []), []);
});

test("splitByShares divides proportionally with largest remainder cent distribution", () => {
  // Total 100, shares: p1=1, p2=2 (total 3 parts)
  // 100 * 1/3 = 33.333..., 100 * 2/3 = 66.666...
  // Should distribute to 33.33 and 66.67
  const results = splitByShares(100, [
    { participantId: "p1", share: 1 },
    { participantId: "p2", share: 2 },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].amount, 33.33);
  assert.equal(results[1].amount, 66.67);
  assert.equal(results[0].amount + results[1].amount, 100.00);

  // Three equal shares: 10 with shares 1, 1, 1
  const shares10 = splitByShares(10, [
    { participantId: "p1", share: 1 },
    { participantId: "p2", share: 1 },
    { participantId: "p3", share: 1 },
  ]);
  const sum10 = shares10.reduce((acc, r) => acc + r.amount, 0);
  assert.equal(Math.round(sum10 * 100) / 100, 10);
});

test("splitByCustomAmounts validates explicit amounts", () => {
  const results = splitByCustomAmounts(50, [
    { participantId: "p1", customAmount: 20 },
    { participantId: "p2", customAmount: 30 },
  ]);

  assert.equal(results.length, 2);
  assert.equal(results[0].amount, 20);
  assert.equal(results[1].amount, 30);
  assert.equal(results[0].percentage, 40);
  assert.equal(results[1].percentage, 60);
});

test("calculateItemSplit dispatches based on SplitMode", () => {
  const equalAssignment: ItemAssignment = {
    itemId: "item1",
    splitMode: "EQUAL",
    participants: [{ participantId: "u1" }, { participantId: "u2" }],
  };
  const equalSplits = calculateItemSplit(15, equalAssignment);
  assert.equal(equalSplits.length, 2);
  assert.equal(equalSplits[0].amount, 7.5);
  assert.equal(equalSplits[1].amount, 7.5);

  const customSharesAssignment: ItemAssignment = {
    itemId: "item2",
    splitMode: "CUSTOM_SHARES",
    participants: [
      { participantId: "u1", share: 3 },
      { participantId: "u2", share: 1 },
    ],
  };
  const shareSplits = calculateItemSplit(20, customSharesAssignment);
  assert.equal(shareSplits[0].amount, 15);
  assert.equal(shareSplits[1].amount, 5);

  const customAmountAssignment: ItemAssignment = {
    itemId: "item3",
    splitMode: "CUSTOM_AMOUNT",
    participants: [
      { participantId: "u1", customAmount: 12 },
      { participantId: "u2", customAmount: 8 },
    ],
  };
  const customSplits = calculateItemSplit(20, customAmountAssignment);
  assert.equal(customSplits[0].amount, 12);
  assert.equal(customSplits[1].amount, 8);
});

test("getItemAssignmentSummary evaluates unassigned, partial and assigned status", () => {
  // 1. Unassigned
  const unassigned = getItemAssignmentSummary("item1", 100, undefined);
  assert.equal(unassigned.status, "unassigned");
  assert.equal(unassigned.remainingAmount, 100);

  // 2. Assigned EQUAL
  const assignedEqual = getItemAssignmentSummary("item2", 100, {
    itemId: "item2",
    splitMode: "EQUAL",
    participants: [{ participantId: "p1" }],
  });
  assert.equal(assignedEqual.status, "assigned");
  assert.equal(assignedEqual.remainingAmount, 0);

  // 3. Partial CUSTOM_AMOUNT
  const partial = getItemAssignmentSummary("item3", 100, {
    itemId: "item3",
    splitMode: "CUSTOM_AMOUNT",
    participants: [{ participantId: "p1", customAmount: 60 }],
  });
  assert.equal(partial.status, "partial");
  assert.equal(partial.assignedAmount, 60);
  assert.equal(partial.remainingAmount, 40);

  // 4. Fully assigned CUSTOM_AMOUNT
  const fullCustom = getItemAssignmentSummary("item4", 100, {
    itemId: "item4",
    splitMode: "CUSTOM_AMOUNT",
    participants: [
      { participantId: "p1", customAmount: 60 },
      { participantId: "p2", customAmount: 40 },
    ],
  });
  assert.equal(fullCustom.status, "assigned");
  assert.equal(fullCustom.assignedAmount, 100);
  assert.equal(fullCustom.remainingAmount, 0);
});

test("calculateParticipantSummaries aggregates totals and assigned items", () => {
  const participants: Participant[] = [
    { id: "p1", name: "Ana" },
    { id: "p2", name: "Carlos" },
    { id: "p3", name: "Lucía" },
  ];

  const items = [
    { id: "item1", totalPrice: 30 },
    { id: "item2", totalPrice: 40 },
  ];

  const assignments: Record<string, ItemAssignment> = {
    item1: {
      itemId: "item1",
      splitMode: "EQUAL",
      participants: [{ participantId: "p1" }, { participantId: "p2" }, { participantId: "p3" }],
    }, // 10 each
    item2: {
      itemId: "item2",
      splitMode: "CUSTOM_SHARES",
      participants: [{ participantId: "p1", share: 3 }, { participantId: "p2", share: 1 }],
    }, // p1 = 30, p2 = 10
  };

  const summaries = calculateParticipantSummaries(items, assignments, participants);

  const ana = summaries.find((s) => s.participantId === "p1");
  const carlos = summaries.find((s) => s.participantId === "p2");
  const lucia = summaries.find((s) => s.participantId === "p3");

  assert.equal(ana?.subtotal, 40); // 10 + 30
  assert.equal(ana?.itemCount, 2);
  assert.equal(carlos?.subtotal, 20); // 10 + 10
  assert.equal(carlos?.itemCount, 2);
  assert.equal(lucia?.subtotal, 10); // 10
  assert.equal(lucia?.itemCount, 1);
});

test("getAssignmentProgress tracks completion percentage and status", () => {
  const items = [
    { id: "i1", totalPrice: 100 },
    { id: "i2", totalPrice: 200 },
  ];

  // Neither assigned
  const prog1 = getAssignmentProgress(items, {});
  assert.equal(prog1.progressPercentage, 0);
  assert.equal(prog1.isComplete, false);
  assert.equal(prog1.unassignedItems, 2);

  // i1 fully assigned, i2 not assigned
  const prog2 = getAssignmentProgress(items, {
    i1: {
      itemId: "i1",
      splitMode: "EQUAL",
      participants: [{ participantId: "p1" }],
    },
  });
  assert.equal(prog2.assignedItems, 1);
  assert.equal(prog2.unassignedItems, 1);
  assert.equal(prog2.assignedReceiptAmount, 100);
  assert.equal(prog2.progressPercentage, 33); // 100 / 300 = 33%
  assert.equal(prog2.isComplete, false);

  // Both fully assigned
  const prog3 = getAssignmentProgress(items, {
    i1: {
      itemId: "i1",
      splitMode: "EQUAL",
      participants: [{ participantId: "p1" }],
    },
    i2: {
      itemId: "i2",
      splitMode: "EQUAL",
      participants: [{ participantId: "p2" }],
    },
  });
  assert.equal(prog3.assignedItems, 2);
  assert.equal(prog3.unassignedItems, 0);
  assert.equal(prog3.assignedReceiptAmount, 300);
  assert.equal(prog3.progressPercentage, 100);
  assert.equal(prog3.isComplete, true);
});
