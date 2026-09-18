export type SplitMode = "EQUAL" | "CUSTOM_AMOUNT" | "CUSTOM_SHARES";

export interface ParticipantShare {
  participantId: string;
  share?: number; // Cuotas o partes (e.g., 1, 2, 0.5) para CUSTOM_SHARES
  customAmount?: number; // Monto exacto asignado para CUSTOM_AMOUNT
}

export interface ItemAssignment {
  itemId: string;
  splitMode: SplitMode;
  participants: ParticipantShare[];
}

export type ItemAssignmentStatus = "unassigned" | "partial" | "assigned";

export interface ItemSplitResult {
  participantId: string;
  amount: number;
  percentage: number;
  share?: number;
}

export interface ItemAssignmentSummary {
  itemId: string;
  status: ItemAssignmentStatus;
  totalPrice: number;
  assignedAmount: number;
  remainingAmount: number;
  splits: ItemSplitResult[];
}

export interface ParticipantSummary {
  participantId: string;
  participantName: string;
  color?: string;
  avatar?: string;
  itemCount: number;
  subtotal: number;
  assignedItemIds: string[];
}
