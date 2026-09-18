'use client';

import React, { useMemo, useState } from 'react';
import { PaymentStatus, Receipt } from '@/types/balance';
import { calculateBalanceSummary } from '@/lib/balance';
import { BalanceOverview } from './BalanceOverview';
import { SettlementList } from './SettlementList';
import { ShareSummaryModal } from './ShareSummaryModal';
import { formatCurrency } from '@/lib/share-utils';

interface ReceiptDetailViewProps {
  initialReceipt: Receipt;
}

export function ReceiptDetailView({ initialReceipt }: ReceiptDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'balance' | 'items' | 'payers'>('balance');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [settlementStatuses, setSettlementStatuses] = useState<Record<string, PaymentStatus>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`receipt_settlements_${initialReceipt.id}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // Fallback to initial receipt
      }
    }
    return initialReceipt.settlementStatuses || {};
  });

  const receipt = useMemo<Receipt>(() => {
    return {
      ...initialReceipt,
      settlementStatuses,
    };
  }, [initialReceipt, settlementStatuses]);

  // Persist settlement statuses when they change
  const handleToggleSettlement = (settlementId: string, newStatus: PaymentStatus) => {
    setSettlementStatuses((prev) => {
      const updatedStatuses = {
        ...prev,
        [settlementId]: newStatus,
      };
      try {
        localStorage.setItem(
          `receipt_settlements_${initialReceipt.id}`,
          JSON.stringify(updatedStatuses)
        );
      } catch {
        // Ignore storage write error
      }
      return updatedStatuses;
    });
  };

  const handleResetStatuses = () => {
    try {
      localStorage.removeItem(`receipt_settlements_${initialReceipt.id}`);
    } catch {
      // Ignore
    }
    setSettlementStatuses({});
  };

  const handleMarkAllPaid = () => {
    const freshSummary = calculateBalanceSummary(receipt);
    const allPaid: Record<string, PaymentStatus> = {};
    for (const s of freshSummary.settlements) {
      allPaid[s.id] = 'PAID';
    }
    try {
      localStorage.setItem(`receipt_settlements_${initialReceipt.id}`, JSON.stringify(allPaid));
    } catch {
      // Ignore
    }
    setSettlementStatuses(allPaid);
  };

  // Dynamically compute balances and settlements
  const summary = useMemo(() => {
    return calculateBalanceSummary(receipt);
  }, [receipt]);

  const currency = receipt.currency || '$';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      {/* Top Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {receipt.id}
            </span>
            {receipt.date && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {receipt.date}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {receipt.title}
          </h1>
          {receipt.notes && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {receipt.notes}
            </p>
          )}
        </div>

        {/* Share Button Primary CTA */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-98 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <span>📤</span>
            <span>Compartir Resumen</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="mb-6 flex space-x-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold sm:text-sm dark:bg-zinc-800/80">
        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className={`flex-1 rounded-lg py-2.5 text-center transition-all ${
            activeTab === 'balance'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          💰 Saldos y Quién Paga ({summary.settlements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex-1 rounded-lg py-2.5 text-center transition-all ${
            activeTab === 'items'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          📋 Ítems ({receipt.items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payers')}
          className={`flex-1 rounded-lg py-2.5 text-center transition-all ${
            activeTab === 'payers'
              ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-900 dark:text-indigo-400'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          💳 Pagadores ({receipt.payers.length})
        </button>
      </nav>

      {/* Tab 1: Saldos y Quién Paga */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-4 py-2 text-xs text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
            <span>
              Transferencias:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {summary.settledCount} de {summary.totalSettlementsCount}
              </strong>{' '}
              saldadas
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPaid}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Marcar todas pagadas
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleResetStatuses}
                className="font-medium text-zinc-500 hover:underline dark:text-zinc-400"
              >
                Restablecer
              </button>
            </div>
          </div>

          {/* Quién Paga a Quién (Settlements) */}
          <SettlementList
            settlements={summary.settlements}
            currency={currency}
            onToggleStatus={handleToggleSettlement}
          />

          {/* Resumen General y Balances por Persona */}
          <BalanceOverview summary={summary} />
        </div>
      )}

      {/* Tab 2: Ítems Consumidos */}
      {activeTab === 'items' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
              Desglose de productos consumidos
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Total: {formatCurrency(summary.subtotal, currency)}
            </span>
          </div>

          <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-xs dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {receipt.items.map((it) => {
              const qty = it.quantity ?? 1;
              const totalPrice = it.price * qty;

              return (
                <div key={it.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {it.name}
                        {qty > 1 && (
                          <span className="ml-1.5 text-xs font-normal text-zinc-500">
                            (x{qty} a {formatCurrency(it.price, currency)} c/u)
                          </span>
                        )}
                      </h4>
                      {/* Assigned participants tags */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {it.assignedTo.map((assign, idx) => {
                          const pId = typeof assign === 'string' ? assign : assign.participantId;
                          const p = receipt.participants.find((part) => part.id === pId);
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {p?.name || pId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(totalPrice, currency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Pagadores */}
      {activeTab === 'payers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
              Quiénes abonaron en el lugar
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Total pagado: {formatCurrency(summary.totalPaid, currency)} /{' '}
              {formatCurrency(summary.grandTotal, currency)}
            </span>
          </div>

          <div className="space-y-2">
            {receipt.payers.map((payer, idx) => {
              const participant = receipt.participants.find(
                (p) => p.id === payer.participantId
              );

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: participant?.color || '#4F46E5',
                      }}
                    >
                      {participant?.name.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {participant?.name || payer.participantId}
                      </h4>
                      <p className="text-xs text-zinc-500">Abonó al comercio/restaurante</p>
                    </div>
                  </div>
                  <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(payer.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareSummaryModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        receipt={receipt}
        summary={summary}
      />
    </div>
  );
}
