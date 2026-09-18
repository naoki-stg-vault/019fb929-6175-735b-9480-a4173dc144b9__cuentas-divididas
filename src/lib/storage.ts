import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CreateReceiptDTO, Receipt, ReceiptItem, Participant, UpdateReceiptDTO } from '../types/receipt';
import { calculateSplit } from './split';

function getDataDir(): string {
  if (process.env.RECEIPTS_DATA_DIR) {
    return path.resolve(process.env.RECEIPTS_DATA_DIR);
  }
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR, 'receipts');
  }
  return path.join(process.cwd(), 'data', 'receipts');
}

export const DATA_DIR = getDataDir();

/**
 * Ensures the receipts data directory exists.
 */
export async function ensureDataDir(): Promise<string> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Validates that an ID does not contain path traversal characters.
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

function getReceiptFilePath(dir: string, id: string): string {
  if (!isValidId(id)) {
    throw new Error(`Invalid receipt ID: ${id}`);
  }
  return path.join(dir, `${id}.json`);
}

/**
 * Atomically writes data to a target JSON file by writing to a temporary file
 * in the same directory and renaming it.
 */
export async function writeAtomicJson(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  const tempFileName = `.tmp-${crypto.randomUUID()}`;
  const tempFilePath = path.join(dir, tempFileName);
  const serialized = JSON.stringify(data, null, 2);

  try {
    await fs.writeFile(tempFilePath, serialized, 'utf-8');
    await fs.rename(tempFilePath, filePath);
  } catch (err) {
    await fs.unlink(tempFilePath).catch(() => {});
    throw err;
  }
}

/**
 * Retrieves all stored receipts, sorted by date (descending) and createdAt (descending).
 */
export async function getAllReceipts(): Promise<Receipt[]> {
  const dir = await ensureDataDir();
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const receipts: Receipt[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('.tmp')) {
      const fullPath = path.join(dir, entry.name);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const parsed = JSON.parse(content) as Receipt;
        if (parsed && parsed.id) {
          receipts.push(parsed);
        }
      } catch (err) {
        console.error(`Failed to read/parse receipt file ${entry.name}:`, err);
      }
    }
  }

  return receipts.sort((a, b) => {
    const dateComp = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    if (dateComp !== 0) return dateComp;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

/**
 * Retrieves a single receipt by ID, or null if not found.
 */
export async function getReceiptById(id: string): Promise<Receipt | null> {
  if (!isValidId(id)) return null;

  const dir = await ensureDataDir();
  const filePath = getReceiptFilePath(dir, id);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Receipt;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Creates and stores a new receipt.
 */
export async function createReceipt(dto: CreateReceiptDTO): Promise<Receipt> {
  const dir = await ensureDataDir();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const participants: Participant[] = (dto.participants || []).map((p) => ({
    id: p.id || crypto.randomUUID(),
    name: p.name,
    color: p.color,
    avatar: p.avatar,
  }));

  const items: ReceiptItem[] = (dto.items || []).map((item) => {
    const quantity = item.quantity ?? 1;
    const unitPrice = item.unitPrice ?? (quantity > 0 ? item.totalPrice / quantity : item.totalPrice);
    return {
      id: item.id || crypto.randomUUID(),
      description: item.description,
      quantity,
      unitPrice,
      totalPrice: item.totalPrice,
      assignedParticipantIds: item.assignedParticipantIds || [],
    };
  });

  const subtotal = dto.subtotal ?? items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
  const tax = dto.tax ?? 0;
  const tip = dto.tip ?? 0;
  const total = dto.total ?? Number((subtotal + tax + tip).toFixed(2));

  const split = dto.split ?? calculateSplit({
    items,
    participants,
    subtotal,
    tax,
    tip,
    total,
  });

  const receipt: Receipt = {
    id,
    title: dto.title.trim(),
    date: dto.date || now.split('T')[0],
    currency: dto.currency || 'USD',
    items,
    participants,
    split,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    tip: Number(tip.toFixed(2)),
    total: Number(total.toFixed(2)),
    status: dto.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };

  const filePath = getReceiptFilePath(dir, id);
  await writeAtomicJson(filePath, receipt);

  return receipt;
}

/**
 * Updates an existing receipt. Returns the updated receipt, or null if not found.
 */
export async function updateReceipt(id: string, dto: UpdateReceiptDTO): Promise<Receipt | null> {
  const existing = await getReceiptById(id);
  if (!existing) return null;

  const dir = await ensureDataDir();
  const now = new Date().toISOString();

  let participants = existing.participants;
  if (dto.participants) {
    participants = dto.participants.map((p) => ({
      id: p.id || crypto.randomUUID(),
      name: p.name,
      color: p.color,
      avatar: p.avatar,
    }));
  }

  let items = existing.items;
  if (dto.items) {
    items = dto.items.map((item) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unitPrice ?? (quantity > 0 ? item.totalPrice / quantity : item.totalPrice);
      return {
        id: item.id || crypto.randomUUID(),
        description: item.description,
        quantity,
        unitPrice,
        totalPrice: item.totalPrice,
        assignedParticipantIds: item.assignedParticipantIds || [],
      };
    });
  }

  const subtotal = dto.subtotal !== undefined
    ? dto.subtotal
    : (dto.items ? items.reduce((acc, it) => acc + (it.totalPrice || 0), 0) : existing.subtotal);

  const tax = dto.tax !== undefined ? dto.tax : existing.tax;
  const tip = dto.tip !== undefined ? dto.tip : existing.tip;
  const total = dto.total !== undefined
    ? dto.total
    : Number((subtotal + tax + tip).toFixed(2));

  const split = dto.split !== undefined
    ? dto.split
    : calculateSplit({
        items,
        participants,
        subtotal,
        tax,
        tip,
        total,
      });

  const updated: Receipt = {
    ...existing,
    title: dto.title !== undefined ? dto.title.trim() : existing.title,
    date: dto.date !== undefined ? dto.date : existing.date,
    currency: dto.currency !== undefined ? dto.currency : existing.currency,
    status: dto.status !== undefined ? dto.status : existing.status,
    items,
    participants,
    split,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    tip: Number(tip.toFixed(2)),
    total: Number(total.toFixed(2)),
    updatedAt: now,
  };

  const filePath = getReceiptFilePath(dir, id);
  await writeAtomicJson(filePath, updated);

  return updated;
}

/**
 * Deletes a receipt by ID. Returns true if removed, false if not found.
 */
export async function deleteReceipt(id: string): Promise<boolean> {
  if (!isValidId(id)) return false;

  const dir = await ensureDataDir();
  const filePath = getReceiptFilePath(dir, id);

  try {
    await fs.unlink(filePath);
    return true;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
