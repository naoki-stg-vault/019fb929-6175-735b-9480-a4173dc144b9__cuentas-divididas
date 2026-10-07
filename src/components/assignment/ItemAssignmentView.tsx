"use client";

import React, { useState, useMemo } from "react";
import { Participant } from "@/types/participant";
import { ItemAssignment, ParticipantSummary } from "@/types/assignment";
import { ReceiptItem } from "@/types/item";
import {
  getAssignmentProgress,
  calculateParticipantSummaries,
  getItemAssignmentSummary,
} from "@/lib/split-utils";
import { formatCurrency } from "@/lib/calculations";
import { ParticipantManager } from "@/components/participants/ParticipantManager";
import { ParticipantBadge } from "@/components/participants/ParticipantBadge";
import { ItemAssignmentCard } from "./ItemAssignmentCard";
import { AssignmentProgress } from "./AssignmentProgress";

export interface ItemAssignmentViewProps {
  items: ReceiptItem[];
  initialParticipants?: Participant[];
  initialAssignments?: Record<string, ItemAssignment>;
  currencySymbol?: string;
  onAssignmentsChange?: (
    assignments: Record<string, ItemAssignment>,
    participants: Participant[]
  ) => void;
  onSave?: (
    assignments: Record<string, ItemAssignment>,
    participants: Participant[]
  ) => void;
  readOnly?: boolean;
  title?: string;
  subtitle?: string;
}

export function ItemAssignmentView({
  items,
  initialParticipants = [],
  initialAssignments = {},
  currencySymbol = "$",
  onAssignmentsChange,
  onSave,
  readOnly = false,
  title = "Participantes y Asignación de Ítems",
  subtitle = "Indica quién consumió cada producto de la cuenta de forma equitativa o personalizada.",
}: ItemAssignmentViewProps) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [assignments, setAssignments] = useState<Record<string, ItemAssignment>>(initialAssignments);
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "assigned">("all");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Participant management handlers
  const handleAddParticipant = (newParticipant: Participant) => {
    const next = [...participants, newParticipant];
    setParticipants(next);
    onAssignmentsChange?.(assignments, next);
  };

  const handleUpdateParticipant = (id: string, updated: Partial<Participant>) => {
    const next = participants.map((p) => (p.id === id ? { ...p, ...updated } : p));
    setParticipants(next);
    onAssignmentsChange?.(assignments, next);
  };

  const handleRemoveParticipant = (id: string) => {
    const nextParticipants = participants.filter((p) => p.id !== id);
    setParticipants(nextParticipants);

    // Clean up assignments referencing this participant
    const nextAssignments: Record<string, ItemAssignment> = {};
    for (const [itemId, assign] of Object.entries(assignments)) {
      const filtered = assign.participants.filter((p) => p.participantId !== id);
      nextAssignments[itemId] = {
        ...assign,
        participants: filtered,
      };
    }
    setAssignments(nextAssignments);
    onAssignmentsChange?.(nextAssignments, nextParticipants);
  };

  // Item assignment handler
  const handleItemAssignmentChange = (newAssignment: ItemAssignment) => {
    const nextAssignments = {
      ...assignments,
      [newAssignment.itemId]: newAssignment,
    };
    setAssignments(nextAssignments);
    onAssignmentsChange?.(nextAssignments, participants);
  };

  // Bulk action: Split entire check equally across all participants
  const handleAssignAllItemsEqually = () => {
    if (participants.length === 0 || readOnly) return;

    const nextAssignments: Record<string, ItemAssignment> = {};
    for (const item of items) {
      nextAssignments[item.id] = {
        itemId: item.id,
        splitMode: "EQUAL",
        participants: participants.map((p) => ({
          participantId: p.id,
          share: 1,
        })),
      };
    }
    setAssignments(nextAssignments);
    onAssignmentsChange?.(nextAssignments, participants);
  };

  // Bulk action: Clear all assignments
  const handleClearAllAssignments = () => {
    if (readOnly) return;
    const nextAssignments: Record<string, ItemAssignment> = {};
    for (const item of items) {
      nextAssignments[item.id] = {
        itemId: item.id,
        splitMode: "EQUAL",
        participants: [],
      };
    }
    setAssignments(nextAssignments);
    onAssignmentsChange?.(nextAssignments, participants);
  };

  // Calculations: Progress and Participant Subtotals
  const progress = useMemo(() => {
    return getAssignmentProgress(items, assignments);
  }, [items, assignments]);

  const participantSummaries: ParticipantSummary[] = useMemo(() => {
    return calculateParticipantSummaries(items, assignments, participants);
  }, [items, assignments, participants]);

  // Filtered items list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const summary = getItemAssignmentSummary(item.id, item.totalPrice, assignments[item.id]);
      if (filterMode === "pending") {
        return summary.status !== "assigned";
      }
      if (filterMode === "assigned") {
        return summary.status === "assigned";
      }
      return true;
    });
  }, [items, assignments, filterMode]);

  const handleSave = () => {
    onSave?.(assignments, participants);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="w-full space-y-6" data-testid="item-assignment-view">
      {/* View Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
              {participants.length} participantes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {subtitle}
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAssignAllItemsEqually}
              disabled={participants.length === 0 || items.length === 0}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 disabled:opacity-40 transition-colors"
              title="Asigna todos los productos por partes iguales entre todos los participantes"
            >
              👥 Dividir todo parejo
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>✓ Guardar Asignación</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
          <span className="font-bold">✓</span>
          <span>¡Participantes y asignaciones guardadas correctamente!</span>
        </div>
      )}

      {/* Section 1: Participant Manager */}
      <ParticipantManager
        participants={participants}
        onAddParticipant={handleAddParticipant}
        onUpdateParticipant={handleUpdateParticipant}
        onRemoveParticipant={handleRemoveParticipant}
        readOnly={readOnly}
      />

      {/* Main Grid: Left = Item Cards with Filters; Right = Progress & Participant Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items to Assign (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar & Clear Actions */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-zinc-400 font-medium mr-1 hidden sm:inline">
                Ver:
              </span>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === "all"
                    ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === "pending"
                    ? "bg-amber-600 text-white"
                    : "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
              >
                Pendientes ({progress.unassignedItems + progress.partialItems})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("assigned")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === "assigned"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                }`}
              >
                Completos ({progress.assignedItems})
              </button>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleClearAllAssignments}
                className="text-xs text-zinc-400 hover:text-rose-600 transition-colors"
                title="Desmarcar todas las asignaciones de todos los productos"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Empty State */}
          {items.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                No hay productos disponibles para asignar
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Regresa al paso anterior para verificar los productos de la cuenta.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                No hay productos en esta categoría
              </p>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Mostrar todos los productos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <ItemAssignmentCard
                  key={item.id}
                  item={item}
                  assignment={assignments[item.id]}
                  participants={participants}
                  onAssignmentChange={handleItemAssignmentChange}
                  currencySymbol={currencySymbol}
                  readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Progress & Participant Summary (Col 4) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          {/* Progress Widget */}
          <AssignmentProgress
            totalItems={progress.totalItems}
            assignedItems={progress.assignedItems}
            partialItems={progress.partialItems}
            unassignedItems={progress.unassignedItems}
            totalReceiptAmount={progress.totalReceiptAmount}
            assignedReceiptAmount={progress.assignedReceiptAmount}
            progressPercentage={progress.progressPercentage}
            isComplete={progress.isComplete}
            currencySymbol={currencySymbol}
          />

          {/* Live Participant Consumption Subtotals */}
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            data-testid="participants-breakdown"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Subtotal por comensal
              </h4>
              <span className="text-[11px] text-zinc-400 font-medium">
                {participants.length} personas
              </span>
            </div>

            {participants.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-4">
                Agrega participantes para ver su total individual.
              </p>
            ) : (
              <div className="space-y-2">
                {participantSummaries.map((summary, idx) => (
                  <div
                    key={summary.participantId}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ParticipantBadge
                        participant={{
                          id: summary.participantId,
                          name: summary.participantName,
                          color: summary.color,
                        }}
                        colorIndex={idx}
                        size="sm"
                      />
                      <span className="text-[11px] text-zinc-400">
                        ({summary.itemCount} {summary.itemCount === 1 ? "ítem" : "ítems"})
                      </span>
                    </div>

                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                      {formatCurrency(summary.subtotal, currencySymbol)}
                    </span>
                  </div>
                ))}

                {/* Total across participants vs receipt total */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-500">Suma distribuida:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(progress.assignedReceiptAmount, currencySymbol)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
