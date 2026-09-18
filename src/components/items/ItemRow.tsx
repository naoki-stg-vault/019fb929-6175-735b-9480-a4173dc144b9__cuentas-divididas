"use client";

import React, { useState } from "react";
import { ReceiptItem } from "@/types/item";
import { formatCurrency, parseNumber } from "@/lib/calculations";

interface ItemRowProps {
  item: ReceiptItem;
  currencySymbol?: string;
  onUpdate: (updated: Partial<ReceiptItem>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function ItemRow({
  item,
  currencySymbol = "$",
  onUpdate,
  onDelete,
  readOnly = false,
}: ItemRowProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const isLowConfidence =
    item.confidence !== undefined && item.confidence < 0.7 && !item.isManuallyAdded;

  const handleQuantityStep = (delta: number) => {
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    onUpdate({ quantity: nextQty });
  };

  const handlePriceChange = (val: string) => {
    const parsed = parseNumber(val, 0);
    onUpdate({ unitPrice: parsed });
  };

  return (
    <tr
      className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 ${
        isLowConfidence ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
      }`}
      data-testid={`item-row-${item.id}`}
    >
      {/* Description & Confidence Badge */}
      <td className="py-3 px-4">
        <div className="space-y-1">
          {readOnly ? (
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {item.description}
            </span>
          ) : isEditingDescription ? (
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingDescription(false);
              }}
              autoFocus
              className="w-full max-w-sm px-2.5 py-1 text-sm rounded-lg border border-emerald-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none ring-2 ring-emerald-500/20"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingDescription(true)}
              className="text-left text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 group"
            >
              <span>{item.description || "(Sin nombre)"}</span>
              <svg
                className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2">
            {item.category && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {item.category}
              </span>
            )}
            {isLowConfidence ? (
              <span
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center gap-1"
                title={`Confianza OCR: ${Math.round((item.confidence || 0) * 100)}%`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Revisar ({Math.round((item.confidence || 0) * 100)}%)
              </span>
            ) : item.isManuallyAdded ? (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Manual
              </span>
            ) : null}
          </div>
        </div>
      </td>

      {/* Quantity Stepper */}
      <td className="py-3 px-4 text-center">
        {readOnly ? (
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.quantity}
          </span>
        ) : (
          <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={item.quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-l-lg"
              aria-label={`Disminuir cantidad de ${item.description}`}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate({ quantity: isNaN(val) ? 1 : Math.max(1, val) });
              }}
              className="w-10 text-center text-xs font-bold bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-r-lg"
              aria-label={`Aumentar cantidad de ${item.description}`}
            >
              +
            </button>
          </div>
        )}
      </td>

      {/* Unit Price Input */}
      <td className="py-3 px-4 text-right">
        {readOnly ? (
          <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            {formatCurrency(item.unitPrice, currencySymbol)}
          </span>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={item.unitPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-24 px-2 py-1 text-right text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        )}
      </td>

      {/* Total Price */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(item.totalPrice, currencySymbol)}
        </span>
      </td>

      {/* Actions */}
      {!readOnly && (
        <td className="py-3 px-4 text-right">
          {isConfirmingDelete ? (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-lg border border-rose-200 dark:border-rose-900/60">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium pl-1">
                ¿Borrar?
              </span>
              <button
                type="button"
                onClick={onDelete}
                className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              aria-label={`Eliminar fila ${item.description}`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
