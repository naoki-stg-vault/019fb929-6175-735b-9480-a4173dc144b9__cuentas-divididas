"use client";

import React, { useState } from "react";
import {
  Participant,
  PARTICIPANT_PALETTE,
  ParticipantColorOption,
  getParticipantColor,
} from "@/types/participant";
import { ParticipantBadge } from "./ParticipantBadge";

export interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (participant: Participant) => void;
  onUpdateParticipant: (id: string, updated: Partial<Participant>) => void;
  onRemoveParticipant: (id: string) => void;
  readOnly?: boolean;
}

export function ParticipantManager({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onRemoveParticipant,
  readOnly = false,
}: ParticipantManagerProps) {
  const [nameInput, setNameInput] = useState("");
  const [selectedColorId, setSelectedColorId] = useState<string>(
    PARTICIPANT_PALETTE[participants.length % PARTICIPANT_PALETTE.length].id
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColorId, setEditColorId] = useState("");

  // Deletion confirm state
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorMessage("Por favor ingresa un nombre para el participante.");
      return;
    }

    const exists = participants.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMessage(`Ya existe un participante con el nombre "${trimmed}".`);
      return;
    }

    const newParticipant: Participant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      color: selectedColorId,
    };

    onAddParticipant(newParticipant);
    setNameInput("");
    setErrorMessage(null);

    // Auto rotate to next available color
    const nextColorIndex = (participants.length + 1) % PARTICIPANT_PALETTE.length;
    setSelectedColorId(PARTICIPANT_PALETTE[nextColorIndex].id);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColorId(p.color || "emerald");
    setConfirmingDeleteId(null);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    onUpdateParticipant(id, {
      name: trimmed,
      color: editColorId,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Quick preset additions
  const handleAddPresetGroup = (names: string[]) => {
    names.forEach((name, idx) => {
      if (!participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        const color = PARTICIPANT_PALETTE[(participants.length + idx) % PARTICIPANT_PALETTE.length].id;
        onAddParticipant({
          id: `p_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
          name,
          color,
        });
      }
    });
  };

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
      data-testid="participant-manager"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            👥
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Participantes
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {participants.length}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Personas que compartirán los gastos de este comprobante
            </p>
          </div>
        </div>

        {/* Quick presets for mobile convenience */}
        {!readOnly && participants.length === 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-zinc-400">Plantillas rápidas:</span>
            <button
              type="button"
              onClick={() => handleAddPresetGroup(["Ana", "Carlos"])}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
            >
              + 2 personas
            </button>
            <button
              type="button"
              onClick={() => handleAddPresetGroup(["Ana", "Carlos", "Lucía", "Martín"])}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
            >
              + 4 personas
            </button>
          </div>
        )}
      </div>

      {/* Add Participant Input Section */}
      {!readOnly && (
        <div className="space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Nombre o apodo (ej. Ana, Juan, Papá)..."
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                aria-label="Nombre del nuevo participante"
              />
            </div>

            {/* Color Swatch Selector for the new participant */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-[11px] text-zinc-400 font-medium sm:hidden">Color:</span>
              <div className="flex items-center gap-1">
                {PARTICIPANT_PALETTE.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColorId(col.id)}
                    className={`w-5 h-5 rounded-full ${col.bgClass} transition-transform ${
                      selectedColorId === col.id
                        ? "ring-2 ring-offset-2 ring-zinc-800 dark:ring-zinc-100 scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    title={col.name}
                    aria-label={`Seleccionar color ${col.name}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>+</span>
              <span>Agregar</span>
            </button>
          </form>

          {/* Validation error if any */}
          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </p>
          )}
        </div>
      )}

      {/* Participants List */}
      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              No hay participantes agregados
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Agrega a las personas que consumieron para comenzar a asignar productos.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center pt-1">
            {participants.map((p, idx) => {
              const isEditing = editingId === p.id;
              const isConfirmingDelete = confirmingDeleteId === p.id;

              if (isEditing) {
                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-indigo-400 dark:border-indigo-600 shadow-xs"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(p.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                      className="px-2 py-1 text-xs font-semibold rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {/* Color picker in edit mode */}
                    <div className="flex items-center gap-1">
                      {PARTICIPANT_PALETTE.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setEditColorId(col.id)}
                          className={`w-4 h-4 rounded-full ${col.bgClass} ${
                            editColorId === col.id ? "ring-2 ring-offset-1 ring-zinc-700" : "opacity-70"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(p.id)}
                        className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              }

              if (isConfirmingDelete) {
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 p-1 px-2.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60"
                  >
                    <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                      ¿Quitar a {p.name}?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveParticipant(p.id);
                        setConfirmingDeleteId(null);
                      }}
                      className="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      className="px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-200"
                    >
                      No
                    </button>
                  </div>
                );
              }

              return (
                <ParticipantBadge
                  key={p.id}
                  participant={p}
                  colorIndex={idx}
                  onEdit={!readOnly ? () => handleStartEdit(p) : undefined}
                  onRemove={!readOnly ? () => setConfirmingDeleteId(p.id) : undefined}
                  size="md"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
