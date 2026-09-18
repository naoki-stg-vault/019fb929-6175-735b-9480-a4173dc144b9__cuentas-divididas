'use client';

import React, { useState } from 'react';
import { PaymentStatus, Settlement } from '@/types/balance';
import { formatCurrency } from '@/lib/share-utils';

interface SettlementListProps {
  settlements: Settlement[];
  currency?: string;
  onToggleStatus: (settlementId: string, newStatus: PaymentStatus) => void;
}

type FilterType = 'ALL' | 'PENDING' | 'PAID';

export function SettlementList({
  settlements,
  currency = '$',
  onToggleStatus,
}: SettlementListProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const totalCount = settlements.length;
  const paidCount = settlements.filter((s) => s.status === 'PAID').length;
  const pendingCount = totalCount - paidCount;
  const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 100;

  const filteredSettlements = settlements.filter((s) => {
    if (filter === 'PENDING') return s.status === 'PENDING';
    if (filter === 'PAID') return s.status === 'PAID';
    return true;
  });

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          ✓
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          ¡Cuentas equilibradas!
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Nadie debe dinero a nadie. Todos han pagado exactamente su consumo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de progreso de pagos */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span>Progreso de liquidación</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {paidCount} de {totalCount} pagados ({progressPercent}%)
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent === 100 && (
          <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            🎉 ¡Todas las deudas han sido saldadas por completo!
          </p>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">
          Quién paga a quién
        </h3>
        <div className="flex rounded-lg bg-zinc-100 p-0.5 text-xs font-medium dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              filter === 'ALL'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PENDING')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              filter === 'PENDING'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('PAID')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              filter === 'PAID'
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Pagados ({paidCount})
          </button>
        </div>
      </div>

      {/* Lista de transferencias */}
      <div className="space-y-2.5">
        {filteredSettlements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            No hay transferencias en esta sección.
          </div>
        ) : (
          filteredSettlements.map((s) => {
            const isPaid = s.status === 'PAID';

            return (
              <div
                key={s.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
                }`}
              >
                {/* Deudor -> Monto -> Acreedor */}
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {s.fromParticipantName}
                    </span>
                    <span className="text-xs text-zinc-400">le paga a</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {s.toParticipantName}
                    </span>
                  </div>
                </div>

                {/* Monto y Botón de Acción */}
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(s.amount, currency)}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleStatus(s.id, isPaid ? 'PENDING' : 'PAID')
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                      isPaid
                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                        : 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60'
                    }`}
                    title={
                      isPaid
                        ? 'Clic para marcar como pendiente'
                        : 'Clic para marcar como pagado'
                    }
                  >
                    {isPaid ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span>✓ Pagado</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>⏳ Marcar Pagado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
