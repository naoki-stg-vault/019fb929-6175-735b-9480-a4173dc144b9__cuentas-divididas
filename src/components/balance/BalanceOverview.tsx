'use client';

import React, { useState } from 'react';
import { BalanceSummary, ParticipantBalance } from '@/types/balance';
import { formatCurrency } from '@/lib/share-utils';

interface BalanceOverviewProps {
  summary: BalanceSummary;
  receiptTitle?: string;
}

export function BalanceOverview({ summary, receiptTitle }: BalanceOverviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const currency = summary.currency;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Resumen General Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Total de la cuenta
            </span>
            <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatCurrency(summary.grandTotal, currency)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Total abonado
            </span>
            <div
              className={`text-lg font-semibold ${
                summary.totalPaid >= summary.grandTotal
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {formatCurrency(summary.totalPaid, currency)}
            </div>
          </div>
        </div>

        {/* Desglose de adicionales */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <span className="text-zinc-500 dark:text-zinc-400">Subtotal ítems</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(summary.subtotal, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <span className="text-zinc-500 dark:text-zinc-400">Propina</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(summary.tip, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <span className="text-zinc-500 dark:text-zinc-400">Impuestos</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(summary.tax, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/60">
            <span className="text-zinc-500 dark:text-zinc-400">Descuento</span>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              -{formatCurrency(summary.discount, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas individuales de participantes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
            Balances por persona ({summary.balances.length})
          </h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Toca una tarjeta para ver el desglose
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {summary.balances.map((p) => {
            const isExpanded = expandedId === p.participantId;
            const initials = p.participantName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const isCreditor = p.netBalance > 0;
            const isDebtor = p.netBalance < 0;
            const isBalanced = p.netBalance === 0;

            return (
              <div
                key={p.participantId}
                onClick={() => toggleExpand(p.participantId)}
                className={`cursor-pointer rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-500/20 dark:border-indigo-600 dark:bg-indigo-950/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                } p-4 shadow-xs`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(p.participantId);
                  }
                }}
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                      style={{
                        backgroundColor: p.participantColor || '#6366F1',
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {p.participantName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Consumo:{' '}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {formatCurrency(p.totalOwed, currency)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Badge de saldo neto */}
                  <div className="text-right">
                    {isCreditor && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Recibe +{formatCurrency(p.netBalance, currency)}
                      </span>
                    )}
                    {isDebtor && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Debe {formatCurrency(Math.abs(p.netBalance), currency)}
                      </span>
                    )}
                    {isBalanced && (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Al día
                      </span>
                    )}
                  </div>
                </div>

                {/* Resumen expandible */}
                {isExpanded && (
                  <div className="mt-3 border-t border-zinc-200/80 pt-3 text-xs dark:border-zinc-700/80">
                    <div className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
                      <div className="flex justify-between">
                        <span>Consumo de productos:</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-200">
                          {formatCurrency(p.consumedAmount, currency)}
                        </span>
                      </div>
                      {p.tipAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Propina proporcional:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-200">
                            +{formatCurrency(p.tipAmount, currency)}
                          </span>
                        </div>
                      )}
                      {p.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Impuestos proporcionales:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-200">
                            +{formatCurrency(p.taxAmount, currency)}
                          </span>
                        </div>
                      )}
                      {p.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Descuento aplicado:</span>
                          <span className="font-mono">
                            -{formatCurrency(p.discountAmount, currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-zinc-100 pt-1.5 font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                        <span>Total debido:</span>
                        <span className="font-mono font-semibold">
                          {formatCurrency(p.totalOwed, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Abonó por adelantado:</span>
                        <span className="font-mono">
                          {formatCurrency(p.paidAmount, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
