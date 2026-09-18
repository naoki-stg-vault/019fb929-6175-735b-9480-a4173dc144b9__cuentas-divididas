export type ReceiptStatus = 'draft' | 'pending' | 'settled' | 'archived';

export interface Participant {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  assignedParticipantIds: string[];
}

export interface ItemSplitDetail {
  itemId: string;
  itemDescription: string;
  participantId: string;
  amount: number;
  proportionalTax: number;
  proportionalTip: number;
  total: number;
}

export interface ParticipantSplit {
  participantId: string;
  participantName: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paid?: number;
  balance?: number;
}

export interface Split {
  items: ItemSplitDetail[];
  participants: ParticipantSplit[];
  totalProratedTax: number;
  totalProratedTip: number;
  grandTotal: number;
}

/**
 * Division is an alias for Split to support both nomenclatures.
 */
export type Division = Split;

export interface Receipt {
  id: string;
  title: string;
  date: string;
  currency: string;
  items: ReceiptItem[];
  participants: Participant[];
  split?: Split;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: ReceiptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantDTO {
  id?: string;
  name: string;
  color?: string;
  avatar?: string;
}

export interface CreateReceiptItemDTO {
  id?: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  assignedParticipantIds?: string[];
}

export interface CreateReceiptDTO {
  title: string;
  date?: string;
  currency?: string;
  items?: (CreateReceiptItemDTO | ReceiptItem)[];
  participants?: (CreateParticipantDTO | Participant)[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  status?: ReceiptStatus;
  split?: Split;
}

export interface UpdateReceiptDTO {
  title?: string;
  date?: string;
  currency?: string;
  items?: (CreateReceiptItemDTO | ReceiptItem)[];
  participants?: (CreateParticipantDTO | Participant)[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  total?: number;
  status?: ReceiptStatus;
  split?: Split;
}
