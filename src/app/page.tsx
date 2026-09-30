"use client";

import React, { useState } from "react";
import { EditableItemsTable } from "@/components/items";
import { ItemAssignmentView } from "@/components/assignment";
import { ReceiptItem, ReceiptTotals } from "@/types/item";
import { Participant } from "@/types/participant";
import { ItemAssignment } from "@/types/assignment";

export default function Home() {
  const [activeStep, setActiveStep] = useState<"items" | "assignment">("items");
  const [currentItems, setCurrentItems] = useState<ReceiptItem[]>([]);
  const [lastCalculatedTotals, setLastCalculatedTotals] = useState<ReceiptTotals | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment>>({});
  const [isMobileSimulated, setIsMobileSimulated] = useState(false);
  const [showJsonInspector, setShowJsonInspector] = useState(false);

  // Key to force reset child table state when cleared
  const [tableKey, setTableKey] = useState("items_table");

  const handleClearAll = () => {
    setCurrentItems([]);
    setParticipants([]);
    setAssignments({});
    setTableKey(`table_${Date.now()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* App Bar / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                CD
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Cuentas Divididas
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {activeStep === "items"
                    ? "Paso 1: Carga y revisión de productos y precios"
                    : "Paso 2: Gestión de participantes y asignación equitativa o personalizada"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions & simulation toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {(currentItems.length > 0 || participants.length > 0) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Limpiar todos los productos y participantes"
              >
                Limpiar datos
              </button>
            )}

            {/* Mobile Preview Viewport Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSimulated(!isMobileSimulated)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 ${
                isMobileSimulated
                  ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
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

        {/* Step Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-2xl max-w-md">
          <button
            type="button"
            onClick={() => setActiveStep("items")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeStep === "items"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <span>1. Revisar Productos</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
              {currentItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep("assignment")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeStep === "assignment"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <span>2. Participantes y Reparto</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              {participants.length}
            </span>
          </button>
        </div>

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

          {/* STEP 1: ITEMS REVIEW */}
          {activeStep === "items" && (
            <div className="space-y-4">
              <EditableItemsTable
                key={tableKey}
                initialItems={currentItems}
                initialTaxPercent={0}
                initialTipPercent={10}
                currencySymbol="$"
                onItemsChange={(items, totals) => {
                  setCurrentItems(items);
                  setLastCalculatedTotals(totals);
                }}
                onSave={(items, totals) => {
                  setCurrentItems(items);
                  setLastCalculatedTotals(totals);
                  setActiveStep("assignment");
                }}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("assignment")}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Continuar a Asignación de Participantes</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PARTICIPANTS & ASSIGNMENT */}
          {activeStep === "assignment" && (
            <div className="space-y-4">
              <ItemAssignmentView
                items={currentItems}
                initialParticipants={participants}
                initialAssignments={assignments}
                currencySymbol="$"
                onAssignmentsChange={(newAssignments, newParticipants) => {
                  setAssignments(newAssignments);
                  setParticipants(newParticipants);
                }}
                onSave={(newAssignments, newParticipants) => {
                  setAssignments(newAssignments);
                  setParticipants(newParticipants);
                }}
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep("items")}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  ← Volver a Productos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live State JSON Inspector for QA and API debugging */}
        {showJsonInspector && (
          <div className="bg-zinc-900 text-zinc-100 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="font-semibold text-fuchsia-400">
                Estado Actual (JSON persistible)
              </span>
              <span className="text-zinc-500">
                {currentItems.length} ítems / {participants.length} participantes / Total: $
                {lastCalculatedTotals?.total ?? 0}
              </span>
            </div>
            <pre className="max-h-80 overflow-auto bg-black/60 p-3 rounded-xl text-[11px] text-zinc-300">
              {JSON.stringify(
                {
                  itemsCount: currentItems.length,
                  totals: lastCalculatedTotals,
                  participants,
                  assignments,
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
