export type PaymentStatus = 'PENDING' | 'PAID';

export interface Participant {
  id: string;
  name: string;
  color?: string;
  phone?: string;
}

export interface ItemAssignment {
  participantId: string;
  shares?: number; // default 1
  customAmount?: number; // fixed amount if custom
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  assignedTo: (string | ItemAssignment)[];
}

export interface Payer {
  participantId: string;
  amount: number;
}

export interface Receipt {
  id: string;
  title: string;
  date: string;
  currency: string;
  items: ReceiptItem[];
  participants: Participant[];
  payers: Payer[];
  tip?: number;
  tax?: number;
  discount?: number;
  settlementStatuses?: Record<string, PaymentStatus>;
  notes?: string;
}

export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  participantColor?: string;
  consumedAmount: number;
  tipAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalOwed: number; // consumed + tip + tax - discount
  paidAmount: number; // what they already paid upfront
  netBalance: number; // paidAmount - totalOwed (> 0: to receive, < 0: to pay)
}

export interface Settlement {
  id: string;
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface BalanceSummary {
  currency: string;
  subtotal: number;
  tax: number;
  tip: number;
  discount: number;
  grandTotal: number;
  totalPaid: number;
  balances: ParticipantBalance[];
  settlements: Settlement[];
  isFullySettled: boolean;
  settledCount: number;
  totalSettlementsCount: number;
}
