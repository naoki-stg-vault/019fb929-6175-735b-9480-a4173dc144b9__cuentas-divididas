import { BalanceSummary, Receipt } from '@/types/balance';

export interface ShareTextOptions {
  includeItemsBreakdown?: boolean;
  includeSettlementStatus?: boolean;
  shareUrl?: string;
}

/**
 * Formats a currency amount with 2 decimal places.
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  const formatted = Math.abs(amount).toFixed(2);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Generates an engaging, easy-to-read text summary for WhatsApp, Telegram, or SMS.
 */
export function buildShareableText(
  receipt: Receipt,
  summary: BalanceSummary,
  options: ShareTextOptions = {}
): string {
  const {
    includeItemsBreakdown = true,
    includeSettlementStatus = true,
    shareUrl,
  } = options;

  const currency = summary.currency || '$';
  const lines: string[] = [];

  // Header
  lines.push(`🧾 *${receipt.title || 'Resumen de Cuenta'}*`);
  if (receipt.date) {
    lines.push(`📅 Fecha: ${receipt.date}`);
  }
  lines.push('');

  // Totals
  lines.push('💰 *TOTALES*');
  lines.push(`• Subtotal: ${formatCurrency(summary.subtotal, currency)}`);
  if (summary.tax > 0) {
    lines.push(`• Impuestos: ${formatCurrency(summary.tax, currency)}`);
  }
  if (summary.tip > 0) {
    lines.push(`• Propina: ${formatCurrency(summary.tip, currency)}`);
  }
  if (summary.discount > 0) {
    lines.push(`• Descuento: -${formatCurrency(summary.discount, currency)}`);
  }
  lines.push(`*Total General: ${formatCurrency(summary.grandTotal, currency)}*`);
  lines.push('');

  // Individual Balances
  lines.push('👥 *RESUMEN POR PERSONA*');
  for (const b of summary.balances) {
    let balanceNote = '';
    if (b.netBalance > 0) {
      balanceNote = ` (recibe ${formatCurrency(b.netBalance, currency)})`;
    } else if (b.netBalance < 0) {
      balanceNote = ` (debe ${formatCurrency(Math.abs(b.netBalance), currency)})`;
    } else {
      balanceNote = ' (al día)';
    }

    lines.push(
      `• *${b.participantName}*: consumo ${formatCurrency(
        b.totalOwed,
        currency
      )}${balanceNote}`
    );
  }
  lines.push('');

  // Settlements ("Quién paga a quién")
  if (summary.settlements.length > 0) {
    lines.push('💸 *¿QUIÉN PAGA A QUIÉN?*');
    for (const s of summary.settlements) {
      const statusIcon = s.status === 'PAID' ? '✅ [PAGADO]' : '⏳ [PENDIENTE]';
      const statusText = includeSettlementStatus ? ` ${statusIcon}` : '';
      lines.push(
        `👉 *${s.fromParticipantName}* paga *${formatCurrency(
          s.amount,
          currency
        )}* a *${s.toParticipantName}*${statusText}`
      );
    }
    lines.push('');
  }

  // Items breakdown (optional)
  if (includeItemsBreakdown && receipt.items && receipt.items.length > 0) {
    lines.push('📋 *PRODUCTOS*');
    for (const it of receipt.items) {
      const qty = it.quantity && it.quantity > 1 ? ` (x${it.quantity})` : '';
      lines.push(`• ${it.name}${qty}: ${formatCurrency(it.price * (it.quantity ?? 1), currency)}`);
    }
    lines.push('');
  }

  // Share URL if provided
  if (shareUrl) {
    lines.push('🔗 *Ver detalle y marcar pagos:*');
    lines.push(shareUrl);
  }

  return lines.join('\n').trim();
}

/**
 * Builds a WhatsApp share URL with the pre-filled text.
 */
export function getWhatsAppShareUrl(text: string, phone?: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const baseUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}`
    : 'https://api.whatsapp.com/send';
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}

/**
 * Constructs a shareable receipt URL.
 */
export function getShareableLink(receiptId: string, origin?: string): string {
  if (origin) {
    return `${origin.replace(/\/$/, '')}/receipts/${receiptId}`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/receipts/${receiptId}`;
  }
  return `/receipts/${receiptId}`;
}

export interface ShareResult {
  method: 'share' | 'clipboard';
  success: boolean;
  error?: string;
}

/**
 * Uses Web Share API if available and supported, otherwise copies text to clipboard.
 */
export async function shareOrCopy(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<ShareResult> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ text: data.text })
  ) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return { method: 'share', success: true };
    } catch (err: unknown) {
      // AbortError is triggered when user cancels share sheet
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'share', success: false, error: 'Cancelado por el usuario' };
      }
      // Fall through to clipboard if share threw unexpected error
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(data.text);
      return { method: 'clipboard', success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al copiar al portapapeles';
      return { method: 'clipboard', success: false, error: msg };
    }
  }

  return { method: 'clipboard', success: false, error: 'Portapapeles no soportado' };
}
