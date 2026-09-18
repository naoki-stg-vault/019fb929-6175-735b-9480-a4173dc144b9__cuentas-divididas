'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BalanceSummary, Receipt } from '@/types/balance';
import {
  buildShareableText,
  getShareableLink,
  getWhatsAppShareUrl,
  shareOrCopy,
} from '@/lib/share-utils';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt;
  summary: BalanceSummary;
}

export function ShareSummaryModal({
  isOpen,
  onClose,
  receipt,
  summary,
}: ShareSummaryModalProps) {
  const [includeItems, setIncludeItems] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeLink, setIncludeLink] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [canWebShare, setCanWebShare] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      typeof navigator.share === 'function' &&
      'canShare' in navigator &&
      typeof navigator.canShare === 'function'
    ) {
      setCanWebShare(true);
    }
  }, []);

  const shareUrl = useMemo(() => {
    return getShareableLink(receipt.id);
  }, [receipt.id]);

  const shareText = useMemo(() => {
    return buildShareableText(receipt, summary, {
      includeItemsBreakdown: includeItems,
      includeSettlementStatus: includeStatus,
      shareUrl: includeLink ? shareUrl : undefined,
    });
  }, [receipt, summary, includeItems, includeStatus, includeLink, shareUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    const result = await shareOrCopy({
      title: receipt.title || 'Resumen de Cuenta',
      text: shareText,
    });
    if (result.success) {
      setCopyFeedback('¡Texto copiado al portapapeles!');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleCopyLink = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopyFeedback('¡Enlace copiado al portapapeles!');
        setTimeout(() => setCopyFeedback(null), 2500);
      } catch {
        setCopyFeedback('Error al copiar el enlace');
      }
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(shareText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    await shareOrCopy({
      title: receipt.title || 'Resumen de Cuenta',
      text: shareText,
      url: includeLink ? shareUrl : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Compartir Resumen
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Opciones de formato */}
          <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">
              Personalizar detalle:
            </span>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeItems}
                  onChange={(e) => setIncludeItems(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Productos
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeStatus}
                  onChange={(e) => setIncludeStatus(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Estados (Pagado/Pendiente)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeLink}
                  onChange={(e) => setIncludeLink(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Enlace web
              </label>
            </div>
          </div>

          {/* Toast de confirmación de copiado */}
          {copyFeedback && (
            <div className="rounded-lg bg-emerald-100 p-2 text-center text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 animate-in fade-in">
              ✓ {copyFeedback}
            </div>
          )}

          {/* Vista previa del mensaje */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Vista previa (WhatsApp / SMS):</span>
              <span>{shareText.length} caracteres</span>
            </div>
            <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
              {shareText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-98 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>

            {/* Copiar Texto */}
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50 active:scale-98 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              <span>📋</span>
              <span>Copiar Texto</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Copiar Enlace */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <span>🔗</span>
              <span>Copiar Enlace</span>
            </button>

            {/* Compartir Nativo (si disponible) o botón cerrar */}
            {canWebShare ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
              >
                <span>↗</span>
                <span>Compartir...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
