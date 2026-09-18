"use client";

import React, { useState } from "react";
import { EditableItemsTable } from "@/components/items";
import { SAMPLE_OCR_ITEMS, ALTERNATIVE_RECEIPT_ITEMS } from "@/data/mockReceipt";
import { ReceiptItem, ReceiptTotals } from "@/types/item";

export default function Home() {
  const [activeReceiptPreset, setActiveReceiptPreset] = useState<"burgers" | "pizzas" | "empty">("burgers");
  const [currentItems, setCurrentItems] = useState<ReceiptItem[]>(SAMPLE_OCR_ITEMS);
  const [lastCalculatedTotals, setLastCalculatedTotals] = useState<ReceiptTotals | null>(null);
  const [isMobileSimulated, setIsMobileSimulated] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  // Key to force reset child table state when preset changes
  const [tableKey, setTableKey] = useState("burgers");

  const handleSelectPreset = (preset: "burgers" | "pizzas" | "empty") => {
    setActiveReceiptPreset(preset);
    setTableKey(`${preset}_${Date.now()}`);
  };

  const initialItemsForCurrentPreset =
    activeReceiptPreset === "burgers"
      ? SAMPLE_OCR_ITEMS
      : activeReceiptPreset === "pizzas"
      ? ALTERNATIVE_RECEIPT_ITEMS
      : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* App Bar / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                CD
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Cuentas Divididas
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Paso 2: Revisión y corrección de productos y precios detectados por OCR
                </p>
              </div>
            </div>
          </div>

          {/* Quick preset selector & simulation toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSelectPreset("burgers")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeReceiptPreset === "burgers"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Ticket Bar
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("pizzas")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeReceiptPreset === "pizzas"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Ticket Pizzería
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset("empty")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeReceiptPreset === "empty"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                En Blanco
              </button>
            </div>

            {/* Mobile Preview Viewport Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSimulated(!isMobileSimulated)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 ${
                isMobileSimulated
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
              }`}
              title="Alternar vista enmarcada para simulación mobile de 390px"
            >
              <span>📱</span>
              <span className="hidden sm:inline">Vista Móvil</span>
            </button>

            {/* JSON Debug toggle */}
            <button
              type="button"
              onClick={() => setShowJsonInspector(!showJsonInspector)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {showJsonInspector ? "Ocultar JSON" : "Ver JSON"}
            </button>
          </div>
        </header>

        {/* Content Container (Normal or Mobile Simulated) */}
        <div
          className={`mx-auto transition-all duration-300 ${
            isMobileSimulated
              ? "max-w-[420px] p-4 rounded-3xl border-4 border-zinc-300 dark:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-900/40 shadow-2xl"
              : "w-full"
          }`}
        >
          {isMobileSimulated && (
            <div className="mb-3 text-center">
              <span className="inline-block px-3 py-0.5 text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                Simulador Mobile (390px)
              </span>
            </div>
          )}

          <EditableItemsTable
            key={tableKey}
            initialItems={initialItemsForCurrentPreset}
            initialTaxPercent={0}
            initialTipPercent={10}
            currencySymbol="$"
            onItemsChange={(items, totals) => {
              setCurrentItems(items);
              setLastCalculatedTotals(totals);
            }}
            onSave={(items, totals) => {
              console.log("Guardando ítems revisados:", { items, totals });
            }}
          />
        </div>

        {/* Live State JSON Inspector for QA and API debugging */}
        {showJsonInspector && (
          <div className="bg-zinc-900 text-zinc-100 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="font-semibold text-emerald-400">
                Estado Actual (JSON persistible)
              </span>
              <span className="text-zinc-500">
                {currentItems.length} ítems / Total: ${lastCalculatedTotals?.total ?? 0}
              </span>
            </div>
            <pre className="max-h-80 overflow-auto bg-black/60 p-3 rounded-xl text-[11px] text-zinc-300">
              {JSON.stringify(
                {
                  itemsCount: currentItems.length,
                  totals: lastCalculatedTotals,
                  items: currentItems,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
