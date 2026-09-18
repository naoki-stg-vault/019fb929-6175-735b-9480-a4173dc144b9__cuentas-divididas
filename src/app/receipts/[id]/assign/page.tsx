"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ItemAssignmentView } from "@/components/assignment";
import { Receipt } from "@/types/receipt";
import { Participant } from "@/types/participant";
import { ItemAssignment } from "@/types/assignment";
import { ReceiptItem } from "@/types/item";

export default function ReceiptAssignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Load receipt from API
  useEffect(() => {
    let isMounted = true;
    async function fetchReceipt() {
      try {
        setLoading(true);
        const res = await fetch(`/api/receipts/${id}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Comprobante no encontrado"
              : "Error al cargar el comprobante"
          );
        }
        const data = (await res.json()) as Receipt;
        if (isMounted) {
          setReceipt(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchReceipt();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Cargando comprobante...</span>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {error || "Comprobante no encontrado"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No pudimos acceder a los datos de este comprobante. Verifica el enlace o regresa al inicio.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Convert receipt items and assignments
  const initialItems: ReceiptItem[] = receipt.items.map((it) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.totalPrice,
    assignedParticipantIds: it.assignedParticipantIds,
  }));

  const initialAssignments: Record<string, ItemAssignment> = {};
  for (const it of receipt.items) {
    if (it.assignedParticipantIds && it.assignedParticipantIds.length > 0) {
      initialAssignments[it.id] = {
        itemId: it.id,
        splitMode: "EQUAL",
        participants: it.assignedParticipantIds.map((pId) => ({
          participantId: pId,
          share: 1,
        })),
      };
    }
  }

  const handleSaveAssignments = async (
    assignments: Record<string, ItemAssignment>,
    participants: Participant[]
  ) => {
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      // Map assignments back to updated items
      const updatedItems = receipt.items.map((it) => {
        const assign = assignments[it.id];
        const assignedIds = assign ? assign.participants.map((p) => p.participantId) : [];
        return {
          ...it,
          assignedParticipantIds: assignedIds,
        };
      });

      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants,
          items: updatedItems,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar la asignación.");
      }

      const updatedData = (await res.json()) as Receipt;
      setReceipt(updatedData);
      setSaveFeedback("¡Asignaciones guardadas exitosamente!");
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (err) {
      setSaveFeedback(
        err instanceof Error ? err.message : "Error al guardar asignaciones"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Title */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              ← Inicio
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">{receipt.title}</h1>
              <p className="text-xs text-zinc-500">
                Paso 3: Asignación de participantes y división de consumo
              </p>
            </div>
          </div>

          {isSaving && (
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Guardando...
            </span>
          )}
        </div>

        {saveFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            {saveFeedback}
          </div>
        )}

        {/* Integrated Assignment View */}
        <ItemAssignmentView
          items={initialItems}
          initialParticipants={receipt.participants}
          initialAssignments={initialAssignments}
          currencySymbol={receipt.currency === "ARS" ? "$" : receipt.currency === "USD" ? "U$S" : "$"}
          onSave={handleSaveAssignments}
        />
      </div>
    </div>
  );
}
