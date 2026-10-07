"use client";

import React, { useState } from "react";
import { ReceiptTotals } from "@/types/item";
import { formatCurrency } from "@/lib/calculations";

interface TotalsSummaryProps {
  totals: ReceiptTotals;
  currencySymbol?: string;
  onTaxChange?: (taxPercent: number) => void;
  onTipChange?: (tipPercent: number) => void;
  onDiscountChange?: (discount: number) => void;
  readOnly?: boolean;
}

const TIP_PRESETS = [0, 10, 15, 20];

export function TotalsSummary({
  totals,
  currencySymbol = "$",
  onTaxChange,
  onTipChange,
  onDiscountChange,
  readOnly = false,
}: TotalsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customTip, setCustomTip] = useState<string>("");
  const [showCustomTip, setShowCustomTip] = useState(false);

  const handlePresetTip = (percent: number) => {
    setShowCustomTip(false);
    setCustomTip("");
    onTipChange?.(percent);
  };

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTip(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      onTipChange?.(num);
    } else if (val === "") {
      onTipChange?.(0);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header / Mobile Accordion Toggle */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            $
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Resumen de Totales
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {totals.itemCount} {totals.itemCount === 1 ? "ítem detectado" : "ítems detectados"}
            </p>
          </div>
        </div>

        {/* Mobile toggle button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="sm:hidden text-xs font-medium px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Breakdown Details */}
      <div className={`p-4 sm:p-5 space-y-4 ${isExpanded ? "block" : "hidden sm:block"}`}>
        {/* Subtotal */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Subtotal</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold" data-testid="summary-subtotal">
            {formatCurrency(totals.subtotal, currencySymbol)}
          </span>
        </div>

        {/* Descuento si existe o es editable */}
        {(!readOnly || totals.discount > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Descuento</span>
            {readOnly ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                -{formatCurrency(totals.discount, currencySymbol)}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totals.discount || ""}
                  placeholder="0.00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onDiscountChange?.(isNaN(val) ? 0 : val);
                  }}
                  className="w-24 px-2 py-1 text-right text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Impuestos / IVA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">Impuestos / IVA</span>
            {!readOnly && (
              <div className="flex items-center gap-1">
                {[0, 10, 21].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onTaxChange?.(pct)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      totals.taxPercent === pct
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {totals.taxPercent > 0 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({totals.taxPercent}%)
              </span>
            )}
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold" data-testid="summary-tax">
              {formatCurrency(totals.taxAmount, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Propina */}
        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Propina</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold" data-testid="summary-tip">
              {formatCurrency(totals.tipAmount, currencySymbol)}
            </span>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {TIP_PRESETS.map((preset) => {
                const isActive = !showCustomTip && totals.tipPercent === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetTip(preset)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {preset === 0 ? "Sin propina" : `${preset}%`}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustomTip(!showCustomTip)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                  showCustomTip
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                Otro %
              </button>

              {showCustomTip && (
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="%"
                    value={customTip}
                    onChange={handleCustomTipChange}
                    className="w-16 px-2 py-0.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <span className="text-xs text-zinc-500">%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grand Total Banner */}
      <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total General
          </span>
          <p className="text-xs text-zinc-400">Incluye IVA y propina</p>
        </div>
        <div className="text-right">
          <span
            className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight"
            data-testid="summary-grand-total"
          >
            {formatCurrency(totals.total, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}
