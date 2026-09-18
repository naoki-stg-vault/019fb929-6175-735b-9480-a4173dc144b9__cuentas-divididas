"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { EditableItemsTableProps, ReceiptItem } from "@/types/item";
import { calculateItemTotal, calculateTotals } from "@/lib/calculations";
import { ItemRow } from "./ItemRow";
import { ItemCard } from "./ItemCard";
import { AddItemForm } from "./AddItemForm";
import { TotalsSummary } from "./TotalsSummary";

export function EditableItemsTable({
  initialItems = [],
  initialTaxPercent = 0,
  initialTipPercent = 10,
  initialDiscount = 0,
  currencySymbol = "$",
  onItemsChange,
  onSave,
  readOnly = false,
  title = "Revisión de Productos Detectados",
}: EditableItemsTableProps) {
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);
  const [taxPercent, setTaxPercent] = useState<number>(initialTaxPercent);
  const [tipPercent, setTipPercent] = useState<number>(initialTipPercent);
  const [discount, setDiscount] = useState<number>(initialDiscount);
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // Keep reference of initial items for reset
  const initialItemsRef = useRef<ReceiptItem[]>(initialItems);

  // Calculate totals whenever items, tax, tip, or discount changes
  const totals = useMemo(() => {
    return calculateTotals(items, { taxPercent, tipPercent, discount });
  }, [items, taxPercent, tipPercent, discount]);

  // Notify parent on changes
  useEffect(() => {
    onItemsChange?.(items, totals);
  }, [items, totals, onItemsChange]);

  // Statistics
  const lowConfidenceCount = useMemo(() => {
    return items.filter(
      (item) => item.confidence !== undefined && item.confidence < 0.7 && !item.isManuallyAdded
    ).length;
  }, [items]);

  const displayedItems = useMemo(() => {
    if (!filterNeedsReview) return items;
    return items.filter(
      (item) => item.confidence !== undefined && item.confidence < 0.7 && !item.isManuallyAdded
    );
  }, [items, filterNeedsReview]);

  // Handlers
  const handleUpdateItem = (id: string, updatedFields: Partial<ReceiptItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nextQty =
          updatedFields.quantity !== undefined ? updatedFields.quantity : item.quantity;
        const nextPrice =
          updatedFields.unitPrice !== undefined ? updatedFields.unitPrice : item.unitPrice;

        return {
          ...item,
          ...updatedFields,
          totalPrice: calculateItemTotal(nextQty, nextPrice),
          // When edited by human, bump confidence
          confidence: updatedFields.unitPrice !== undefined || updatedFields.quantity !== undefined || updatedFields.description !== undefined
            ? 1.0
            : item.confidence,
        };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = (newItem: ReceiptItem) => {
    setItems((prev) => [newItem, ...prev]);
  };

  const handleResetToOCR = () => {
    setItems(initialItemsRef.current);
    setIsConfirmingReset(false);
  };

  const handleSave = () => {
    onSave?.(items, totals);
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 3000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {items.length} {items.length === 1 ? "ítem" : "ítems"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Revisa los precios y cantidades detectados por el OCR antes de dividir la cuenta.
          </p>
        </div>

        {/* Global Toolbar */}
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isConfirmingReset ? (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium px-1">
                  ¿Restablecer al OCR original?
                </span>
                <button
                  type="button"
                  onClick={handleResetToOCR}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Descartar correcciones y volver al resultado inicial del OCR"
              >
                ↺ Restablecer OCR
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>✓ Confirmar Productos</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">✓</span>
            <span>Productos y totales actualizados correctamente para el desglose.</span>
          </div>
        </div>
      )}

      {/* OCR Warning Alert if low-confidence items exist */}
      {lowConfidenceCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-amber-600 dark:text-amber-400 font-bold text-base mt-0.5 sm:mt-0">
              ⚠️
            </span>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                {lowConfidenceCount}{" "}
                {lowConfidenceCount === 1
                  ? "producto requiere revisión de OCR"
                  : "productos requieren revisión de OCR"}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Algunos precios o nombres pueden tener caracteres dudosos en el comprobante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFilterNeedsReview(!filterNeedsReview)}
            className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-900 transition-colors"
          >
            {filterNeedsReview ? "Mostrar todos los ítems" : "Filtrar por revisar"}
          </button>
        </div>
      )}

      {/* Main Grid: Left = Table/Cards + Add Form; Right = Totals Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Products List Section */}
        <div className="lg:col-span-8 space-y-4">
          {/* Add Item Trigger / Form */}
          {!readOnly && (
            <AddItemForm
              onAddItem={handleAddItem}
              currencySymbol={currencySymbol}
            />
          )}

          {/* Empty State */}
          {items.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                No hay productos en la lista
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Agrega un ítem manualmente o vuelve a subir una foto del ticket.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards List */}
              <div className="block md:hidden space-y-2.5">
                {displayedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    currencySymbol={currencySymbol}
                    onUpdate={(fields) => handleUpdateItem(item.id, fields)}
                    onDelete={() => handleDeleteItem(item.id)}
                    readOnly={readOnly}
                  />
                ))}
              </div>

              {/* Desktop View: Full Responsive Table */}
              <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <th className="py-3 px-4">Producto / OCR</th>
                      <th className="py-3 px-4 text-center w-36">Cantidad</th>
                      <th className="py-3 px-4 text-right w-36">Precio Unitario</th>
                      <th className="py-3 px-4 text-right w-36">Total</th>
                      {!readOnly && <th className="py-3 px-4 text-right w-20">Acción</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        currencySymbol={currencySymbol}
                        onUpdate={(fields) => handleUpdateItem(item.id, fields)}
                        onDelete={() => handleDeleteItem(item.id)}
                        readOnly={readOnly}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Totals Summary Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <TotalsSummary
            totals={totals}
            currencySymbol={currencySymbol}
            onTaxChange={setTaxPercent}
            onTipChange={setTipPercent}
            onDiscountChange={setDiscount}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
