"use client";

import React from "react";
import { formatCurrency } from "@/lib/calculations";

export interface AssignmentProgressProps {
  totalItems: number;
  assignedItems: number;
  partialItems: number;
  unassignedItems: number;
  totalReceiptAmount: number;
  assignedReceiptAmount: number;
  progressPercentage: number;
  isComplete: boolean;
  currencySymbol?: string;
  className?: string;
}

export function AssignmentProgress({
  totalItems,
  assignedItems,
  partialItems,
  unassignedItems,
  totalReceiptAmount,
  assignedReceiptAmount,
  progressPercentage,
  isComplete,
  currencySymbol = "$",
  className = "",
}: AssignmentProgressProps) {
  const remainingAmount = Math.max(0, totalReceiptAmount - assignedReceiptAmount);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 ${className}`}
      data-testid="assignment-progress"
    >
      {/* Title & Status Indicator */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isComplete
                ? "bg-emerald-500 animate-pulse"
                : partialItems > 0
                ? "bg-amber-500"
                : "bg-blue-500"
            }`}
          />
          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            Progreso de asignación
          </h4>
        </div>

        {/* Status Pill */}
        {isComplete ? (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <span>✓</span>
            <span>¡100% Asignado!</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {assignedItems} de {totalItems} productos cubiertos
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso total de asignación"
          className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200/60 dark:border-zinc-700/60"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : progressPercentage > 50
                ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                : "bg-gradient-to-r from-indigo-500 to-blue-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>

        {/* Amount Stats */}
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>
            Asignado:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {formatCurrency(assignedReceiptAmount, currencySymbol)}
            </strong>{" "}
            ({progressPercentage}%)
          </span>
          <span>
            Total:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {formatCurrency(totalReceiptAmount, currencySymbol)}
            </strong>
          </span>
        </div>
      </div>

      {/* Quick Counters Footer */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] text-zinc-400 font-medium">Asignados</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {assignedItems}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] text-zinc-400 font-medium">Parciales</span>
          <span
            className={`text-sm font-bold ${
              partialItems > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {partialItems}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <span className="block text-[10px] text-zinc-400 font-medium">Pendientes</span>
          <span
            className={`text-sm font-bold ${
              unassignedItems > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {unassignedItems}
          </span>
        </div>
      </div>

      {/* Warning banner if remaining money */}
      {remainingAmount > 0.01 && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>Resta asignar:</span>
          </span>
          <strong className="font-bold">
            {formatCurrency(remainingAmount, currencySymbol)}
          </strong>
        </div>
      )}
    </div>
  );
}
