"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Participant } from "@/types/participant";
import { ItemAssignment, ParticipantShare } from "@/types/assignment";
import { formatCurrency, parseNumber, roundCurrency } from "@/lib/calculations";
import { splitByShares, splitByCustomAmounts } from "@/lib/split-utils";
import { ParticipantBadge } from "@/components/participants/ParticipantBadge";

export interface CustomSplitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: ItemAssignment) => void;
  item: {
    id: string;
    description: string;
    quantity: number;
    totalPrice: number;
  };
  currentAssignment?: ItemAssignment;
  participants: Participant[];
  currencySymbol?: string;
}

interface CustomSplitFormProps {
  onClose: () => void;
  onSave: (assignment: ItemAssignment) => void;
  item: {
    id: string;
    description: string;
    quantity: number;
    totalPrice: number;
  };
  currentAssignment?: ItemAssignment;
  participants: Participant[];
  currencySymbol?: string;
}

function CustomSplitForm({
  onClose,
  onSave,
  item,
  currentAssignment,
  participants,
  currencySymbol = "$",
}: CustomSplitFormProps) {
  // Determine initial state based on currentAssignment
  const initialMode =
    currentAssignment?.splitMode === "CUSTOM_AMOUNT" ? "CUSTOM_AMOUNT" : "CUSTOM_SHARES";

  const [splitMode, setSplitMode] = useState<"CUSTOM_SHARES" | "CUSTOM_AMOUNT">(initialMode);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (currentAssignment && currentAssignment.participants.length > 0) {
      return new Set(currentAssignment.participants.map((p) => p.participantId));
    }
    return new Set(participants.map((p) => p.id));
  });

  const [sharesMap, setSharesMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (currentAssignment && currentAssignment.participants.length > 0) {
      for (const p of currentAssignment.participants) {
        map[p.participantId] = p.share && p.share > 0 ? p.share : 1;
      }
    } else {
      participants.forEach((p) => {
        map[p.id] = 1;
      });
    }
    return map;
  });

  const [amountsMap, setAmountsMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (currentAssignment && currentAssignment.participants.length > 0) {
      for (const p of currentAssignment.participants) {
        map[p.participantId] = p.customAmount !== undefined ? p.customAmount : 0;
      }
    } else {
      const count = Math.max(1, participants.length);
      const perPerson = roundCurrency(item.totalPrice / count);
      participants.forEach((p) => {
        map[p.id] = perPerson;
      });
    }
    return map;
  });

  // Calculations for CUSTOM_SHARES
  const shareCalculations = useMemo(() => {
    const active = participants
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        participantId: p.id,
        share: sharesMap[p.id] && sharesMap[p.id] > 0 ? sharesMap[p.id] : 1,
      }));

    return splitByShares(item.totalPrice, active);
  }, [participants, selectedIds, sharesMap, item.totalPrice]);

  // Calculations for CUSTOM_AMOUNT
  const amountCalculations = useMemo(() => {
    const active = participants
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        participantId: p.id,
        customAmount: amountsMap[p.id] ?? 0,
      }));

    const assignedSum = roundCurrency(
      active.reduce((acc, a) => acc + (a.customAmount || 0), 0)
    );
    const diff = roundCurrency(item.totalPrice - assignedSum);

    return {
      active,
      assignedSum,
      diff,
      isExactMatch: Math.abs(diff) < 0.01,
      splits: splitByCustomAmounts(item.totalPrice, active),
    };
  }, [participants, selectedIds, amountsMap, item.totalPrice]);

  // Toggle participant selection
  const handleToggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!sharesMap[id]) {
          setSharesMap((sm) => ({ ...sm, [id]: 1 }));
        }
      }
      return next;
    });
  };

  // Adjust shares
  const handleShareStep = (id: string, delta: number) => {
    setSharesMap((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // Adjust custom amounts
  const handleAmountChange = (id: string, val: string) => {
    const num = parseNumber(val, 0);
    setAmountsMap((prev) => ({
      ...prev,
      [id]: Math.max(0, num),
    }));
  };

  // Distribute remainder equally among selected participants in CUSTOM_AMOUNT mode
  const handleDistributeRemaining = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const remaining = amountCalculations.diff;
    if (remaining <= 0) return;

    const extraPerPerson = roundCurrency(remaining / ids.length);
    let distributed = 0;

    setAmountsMap((prev) => {
      const next = { ...prev };
      ids.forEach((id, idx) => {
        if (idx === ids.length - 1) {
          next[id] = roundCurrency((next[id] || 0) + (remaining - distributed));
        } else {
          next[id] = roundCurrency((next[id] || 0) + extraPerPerson);
          distributed += extraPerPerson;
        }
      });
      return next;
    });
  };

  // Reset amounts equally
  const handleResetAmountsEqually = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const totalCents = Math.round(item.totalPrice * 100);
    const baseCents = Math.floor(totalCents / ids.length);
    const remainderCents = totalCents % ids.length;

    const next: Record<string, number> = {};
    ids.forEach((id, idx) => {
      const cents = baseCents + (idx < remainderCents ? 1 : 0);
      next[id] = cents / 100;
    });
    setAmountsMap(next);
  };

  const handleSaveAssignment = () => {
    const activeParticipants: ParticipantShare[] = [];

    if (splitMode === "CUSTOM_SHARES") {
      selectedIds.forEach((id) => {
        activeParticipants.push({
          participantId: id,
          share: sharesMap[id] || 1,
        });
      });
    } else {
      selectedIds.forEach((id) => {
        activeParticipants.push({
          participantId: id,
          customAmount: amountsMap[id] || 0,
        });
      });
    }

    onSave({
      itemId: item.id,
      splitMode,
      participants: activeParticipants,
    });
    onClose();
  };

  return (
    <div
      className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            División Personalizada
          </span>
          <h3
            id="custom-split-title"
            className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            {item.description}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total a repartir:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100 text-sm">
              {formatCurrency(item.totalPrice, currencySymbol)}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Cerrar modal de división personalizada"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSplitMode("CUSTOM_SHARES")}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              splitMode === "CUSTOM_SHARES"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <span>⚖️</span>
            <span>Por cuotas / partes</span>
          </button>
          <button
            type="button"
            onClick={() => setSplitMode("CUSTOM_AMOUNT")}
            className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              splitMode === "CUSTOM_AMOUNT"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <span>💵</span>
            <span>Por montos fijos</span>
          </button>
        </div>

        {/* Participant Selection Pool */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Participantes que consumieron ({selectedIds.size} seleccionados):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p, idx) => {
              const isSelected = selectedIds.has(p.id);
              return (
                <ParticipantBadge
                  key={p.id}
                  participant={p}
                  colorIndex={idx}
                  isSelectable
                  isSelected={isSelected}
                  onClick={() => handleToggleParticipant(p.id)}
                  size="sm"
                />
              );
            })}
          </div>
          {selectedIds.size === 0 && (
            <p className="text-xs text-rose-500 font-medium">
              Selecciona al menos un participante para repartir este ítem.
            </p>
          )}
        </div>

        {/* Configuration List according to Split Mode */}
        {selectedIds.size > 0 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {splitMode === "CUSTOM_SHARES"
                ? "Configurar cuotas de consumo por persona:"
                : "Configurar montos manuales por persona:"}
            </label>

            {/* CUSTOM SHARES VIEW */}
            {splitMode === "CUSTOM_SHARES" && (
              <div className="space-y-2">
                {participants
                  .filter((p) => selectedIds.has(p.id))
                  .map((p, idx) => {
                    const share = sharesMap[p.id] || 1;
                    const splitResult = shareCalculations.find(
                      (s) => s.participantId === p.id
                    );
                    const amount = splitResult ? splitResult.amount : 0;
                    const percentage = splitResult ? splitResult.percentage : 0;

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ParticipantBadge
                            participant={p}
                            colorIndex={idx}
                            size="sm"
                          />
                        </div>

                        {/* Stepper + Result */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
                            <button
                              type="button"
                              onClick={() => handleShareStep(p.id, -1)}
                              disabled={share <= 1}
                              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 rounded-l-lg"
                              aria-label={`Disminuir cuota de ${p.name}`}
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {share}x
                            </span>
                            <button
                              type="button"
                              onClick={() => handleShareStep(p.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-r-lg"
                              aria-label={`Aumentar cuota de ${p.name}`}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right w-20">
                            <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(amount, currencySymbol)}
                            </span>
                            <span className="block text-[10px] text-zinc-400">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* CUSTOM AMOUNT VIEW */}
            {splitMode === "CUSTOM_AMOUNT" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {participants
                    .filter((p) => selectedIds.has(p.id))
                    .map((p, idx) => {
                      const amount = amountsMap[p.id] ?? 0;
                      const splitResult = amountCalculations.splits.find(
                        (s) => s.participantId === p.id
                      );
                      const percentage = splitResult ? splitResult.percentage : 0;

                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ParticipantBadge
                              participant={p}
                              colorIndex={idx}
                              size="sm"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                                {currencySymbol}
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => handleAmountChange(p.id, e.target.value)}
                                className="w-24 pl-6 pr-2 py-1 text-right text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <span className="text-[11px] text-zinc-400 w-10 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Actions for Custom Amounts */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={handleResetAmountsEqually}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100"
                  >
                    ↺ Distribuir equitativo
                  </button>

                  {amountCalculations.diff > 0.01 && (
                    <button
                      type="button"
                      onClick={handleDistributeRemaining}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                    >
                      + Repartir remanente ({formatCurrency(amountCalculations.diff, currencySymbol)})
                    </button>
                  )}
                </div>

                {/* Balance / Delta Indicator */}
                <div
                  className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                    amountCalculations.isExactMatch
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : amountCalculations.diff > 0
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Total asignado:</span>
                    <strong>
                      {formatCurrency(amountCalculations.assignedSum, currencySymbol)} de{" "}
                      {formatCurrency(item.totalPrice, currencySymbol)}
                    </strong>
                  </div>

                  {!amountCalculations.isExactMatch && (
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                      <span>
                        {amountCalculations.diff > 0 ? "Faltan por asignar:" : "Monto excedido:"}
                      </span>
                      <strong className="font-bold">
                        {formatCurrency(Math.abs(amountCalculations.diff), currencySymbol)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Action Buttons Footer */}
      <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={selectedIds.size === 0}
          onClick={handleSaveAssignment}
          className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-xs transition-all flex items-center gap-1.5"
        >
          <span>✓ Aplicar División</span>
        </button>
      </div>
    </div>
  );
}

export function CustomSplitDrawer({
  isOpen,
  onClose,
  onSave,
  item,
  currentAssignment,
  participants,
  currencySymbol = "$",
}: CustomSplitDrawerProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-split-title"
    >
      <CustomSplitForm
        key={`${item.id}-${isOpen ? "open" : "closed"}`}
        item={item}
        currentAssignment={currentAssignment}
        participants={participants}
        currencySymbol={currencySymbol}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  );
}
