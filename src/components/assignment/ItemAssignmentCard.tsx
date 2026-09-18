"use client";

import React, { useState, useMemo } from "react";
import { Participant } from "@/types/participant";
import { ItemAssignment, SplitMode } from "@/types/assignment";
import { formatCurrency } from "@/lib/calculations";
import {
  getItemAssignmentSummary,
} from "@/lib/split-utils";
import { ParticipantBadge } from "@/components/participants/ParticipantBadge";
import { CustomSplitDrawer } from "./CustomSplitDrawer";

export interface ItemAssignmentCardProps {
  item: {
    id: string;
    description: string;
    quantity: number;
    totalPrice: number;
    category?: string;
  };
  assignment?: ItemAssignment;
  participants: Participant[];
  onAssignmentChange: (assignment: ItemAssignment) => void;
  currencySymbol?: string;
  readOnly?: boolean;
}

export function ItemAssignmentCard({
  item,
  assignment,
  participants,
  onAssignmentChange,
  currencySymbol = "$",
  readOnly = false,
}: ItemAssignmentCardProps) {
  const [isCustomDrawerOpen, setIsCustomDrawerOpen] = useState(false);

  // Compute status and calculated splits
  const summary = useMemo(() => {
    return getItemAssignmentSummary(item.id, item.totalPrice, assignment);
  }, [item.id, item.totalPrice, assignment]);

  // Set of currently assigned participant IDs
  const assignedParticipantIds = useMemo(() => {
    return new Set(assignment?.participants?.map((p) => p.participantId) || []);
  }, [assignment]);

  // Map of participantId -> calculated split result (amount, share, percentage)
  const splitMap = useMemo(() => {
    const map = new Map<string, { amount: number; percentage: number; share?: number }>();
    if (summary.splits) {
      for (const split of summary.splits) {
        map.set(split.participantId, split);
      }
    }
    return map;
  }, [summary.splits]);

  // Toggle single participant (One-Tap toggle)
  const handleToggleParticipant = (participantId: string) => {
    if (readOnly) return;

    const currentMode: SplitMode = assignment?.splitMode || "EQUAL";
    const currentList = assignment?.participants || [];

    const isAssigned = assignedParticipantIds.has(participantId);

    if (currentMode === "EQUAL") {
      let nextList = currentList.filter((p) => p.participantId !== participantId);
      if (!isAssigned) {
        nextList = [...nextList, { participantId, share: 1 }];
      }

      onAssignmentChange({
        itemId: item.id,
        splitMode: "EQUAL",
        participants: nextList,
      });
    } else {
      // In custom modes, opening the drawer allows fine-tuning
      setIsCustomDrawerOpen(true);
    }
  };

  // Quick Action: Assign All Participants Equally
  const handleAssignAll = () => {
    if (readOnly || participants.length === 0) return;

    onAssignmentChange({
      itemId: item.id,
      splitMode: "EQUAL",
      participants: participants.map((p) => ({
        participantId: p.id,
        share: 1,
      })),
    });
  };

  // Quick Action: Clear all assignments
  const handleClear = () => {
    if (readOnly) return;

    onAssignmentChange({
      itemId: item.id,
      splitMode: "EQUAL",
      participants: [],
    });
  };

  // Status badge styling
  const statusBadge = useMemo(() => {
    if (summary.status === "assigned") {
      const modeText =
        assignment?.splitMode === "CUSTOM_SHARES"
          ? "Por cuotas"
          : assignment?.splitMode === "CUSTOM_AMOUNT"
          ? "Monto fijo"
          : "Equitativo";

      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
          <span>✓</span>
          <span>
            {assignedParticipantIds.size}{" "}
            {assignedParticipantIds.size === 1 ? "persona" : "personas"} ({modeText})
          </span>
        </span>
      );
    }

    if (summary.status === "partial") {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center gap-1">
          <span>⚠️</span>
          <span>Faltan {formatCurrency(summary.remainingAmount, currencySymbol)}</span>
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
        Sin asignar
      </span>
    );
  }, [summary.status, summary.remainingAmount, assignment?.splitMode, assignedParticipantIds.size, currencySymbol]);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
        summary.status === "assigned"
          ? "border-emerald-200/80 dark:border-emerald-900/50 bg-white dark:bg-zinc-900"
          : summary.status === "partial"
          ? "border-amber-300/80 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      } shadow-xs space-y-3`}
      data-testid={`assignment-card-${item.id}`}
    >
      {/* Top Header: Title, Price, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {item.category && (
              <span className="px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {item.category}
              </span>
            )}
            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {item.description}
            </h4>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span>Cantidad: {item.quantity}</span>
            <span>•</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(item.totalPrice, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0">{statusBadge}</div>
      </div>

      {/* Quick Action Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAssignAll}
              disabled={participants.length === 0}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition-colors"
            >
              👥 Todos
            </button>

            {assignedParticipantIds.size > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                ✕ Desmarcar
              </button>
            )}
          </div>

          {/* Custom Split Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsCustomDrawerOpen(true)}
            disabled={participants.length === 0}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              assignment?.splitMode && assignment.splitMode !== "EQUAL"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <span>⚙️</span>
            <span>
              {assignment?.splitMode && assignment.splitMode !== "EQUAL"
                ? "Personalizado"
                : "Personalizar"}
            </span>
          </button>
        </div>
      )}

      {/* Participant Badges: One-Tap Toggle Area */}
      <div className="space-y-1.5 pt-1">
        <span className="block text-[11px] font-medium text-zinc-400">
          Toca para asignar / desasignar:
        </span>

        {participants.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            Agrega participantes arriba para comenzar a asignar este ítem.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((p, idx) => {
              const isSelected = assignedParticipantIds.has(p.id);
              const split = splitMap.get(p.id);

              let amountLabel: string | undefined;
              let shareLabel: string | undefined;

              if (isSelected && split) {
                amountLabel = formatCurrency(split.amount, currencySymbol);
                if (assignment?.splitMode === "CUSTOM_SHARES" && split.share && split.share > 1) {
                  shareLabel = `${split.share}x`;
                }
              }

              return (
                <ParticipantBadge
                  key={p.id}
                  participant={p}
                  colorIndex={idx}
                  isSelectable
                  isSelected={isSelected}
                  onClick={() => handleToggleParticipant(p.id)}
                  amountLabel={amountLabel}
                  shareLabel={shareLabel}
                  size="md"
                  disabled={readOnly}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Drawer for Custom Split */}
      {isCustomDrawerOpen && (
        <CustomSplitDrawer
          isOpen={isCustomDrawerOpen}
          onClose={() => setIsCustomDrawerOpen(false)}
          onSave={(newAssignment) => onAssignmentChange(newAssignment)}
          item={item}
          currentAssignment={assignment}
          participants={participants}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
