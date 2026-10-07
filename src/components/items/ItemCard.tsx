"use client";

import React, { useState } from "react";
import { ReceiptItem } from "@/types/item";
import { formatCurrency, parseNumber } from "@/lib/calculations";

interface ItemCardProps {
  item: ReceiptItem;
  currencySymbol?: string;
  onUpdate: (updated: Partial<ReceiptItem>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function ItemCard({
  item,
  currencySymbol = "$",
  onUpdate,
  onDelete,
  readOnly = false,
}: ItemCardProps) {
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
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
        isLowConfidence
          ? "border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/15"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      } shadow-xs space-y-3`}
      data-testid={`item-card-${item.id}`}
    >
      {/* Top Header: Badge, Category, Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.category && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {item.category}
            </span>
          )}

          {isLowConfidence ? (
            <span
              className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center gap-1"
              title={`Confianza OCR: ${Math.round((item.confidence || 0) * 100)}%`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Revisar OCR ({Math.round((item.confidence || 0) * 100)}%)
            </span>
          ) : item.isManuallyAdded ? (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Manual
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded text-zinc-400 dark:text-zinc-500">
              OCR ✓
            </span>
          )}
        </div>

        {/* Delete button or confirmation */}
        {!readOnly && (
          <div>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-lg border border-rose-200 dark:border-rose-900/60">
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-medium pl-1">
                  ¿Borrar?
                </span>
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded hover:bg-rose-700"
                  aria-label="Confirmar eliminación"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                  aria-label="Cancelar eliminación"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                aria-label={`Eliminar ${item.description}`}
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
          </div>
        )}
      </div>

      {/* Description / Product Name */}
      <div>
        {readOnly ? (
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.description}
          </h4>
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
            className="w-full px-2.5 py-1 text-sm font-medium rounded-lg border border-emerald-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none ring-2 ring-emerald-500/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingDescription(true)}
            className="text-left w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 group"
          >
            <span>{item.description || "(Sin nombre)"}</span>
            <svg
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity"
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
      </div>

      {/* Controls: Quantity Stepper, Unit Price, and Row Total */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Cant:</span>
          {readOnly ? (
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.quantity}
            </span>
          ) : (
            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => handleQuantityStep(-1)}
                disabled={item.quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 rounded-l-lg"
                aria-label={`Disminuir cantidad de ${item.description}`}
              >
                −
              </button>
              <span className="w-7 text-center text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {item.quantity}
              </span>
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
        </div>

        {/* Unit Price Input */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">P. Unit:</span>
          {readOnly ? (
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {formatCurrency(item.unitPrice, currencySymbol)}
            </span>
          ) : (
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={item.unitPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-20 px-2 py-1 text-right text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Total Price */}
        <div className="text-right">
          <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">
            Total
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(item.totalPrice, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}
