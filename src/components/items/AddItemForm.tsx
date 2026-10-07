"use client";

import React, { useState, useRef } from "react";
import { ReceiptItem } from "@/types/item";
import {
  calculateItemTotal,
  formatCurrency,
  generateItemId,
  parseNumber,
  validateReceiptItem,
} from "@/lib/calculations";

interface AddItemFormProps {
  onAddItem: (item: ReceiptItem) => void;
  currencySymbol?: string;
  defaultCategory?: string;
}

const CATEGORIES = ["Comida", "Bebida", "Postre", "Entrada", "Otro"];

export function AddItemForm({
  onAddItem,
  currencySymbol = "$",
  defaultCategory = "Comida",
}: AddItemFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [errors, setErrors] = useState<{
    description?: string;
    quantity?: string;
    unitPrice?: string;
  }>({});

  const descInputRef = useRef<HTMLInputElement>(null);

  const unitPrice = parseNumber(unitPriceInput, 0);
  const estimatedTotal = calculateItemTotal(quantity, unitPrice);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      descInputRef.current?.focus();
    }, 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription("");
    setQuantity(1);
    setUnitPriceInput("");
    setCategory(defaultCategory);
    setErrors({});
  };

  const handleQuantityStep = (delta: number) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedPrice = parseNumber(unitPriceInput, NaN);
    const candidate = {
      description: description.trim(),
      quantity,
      unitPrice: parsedPrice,
    };

    const validation = validateReceiptItem(candidate);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const newItem: ReceiptItem = {
      id: generateItemId(),
      description: description.trim(),
      quantity,
      unitPrice: parsedPrice,
      totalPrice: calculateItemTotal(quantity, parsedPrice),
      category: category || undefined,
      isManuallyAdded: true,
      confidence: 1.0,
    };

    onAddItem(newItem);
    resetForm();
    descInputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium text-sm flex items-center justify-center gap-2 transition-all group"
      >
        <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
          +
        </span>
        <span>Agregar producto manualmente</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl shadow-md ring-2 ring-emerald-500/10 space-y-4 transition-all"
    >
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Nuevo Producto
          </h4>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs p-1"
          aria-label="Cerrar formulario"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
        {/* Descripción */}
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Nombre / Descripción *
          </label>
          <input
            ref={descInputRef}
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="Ej. Pizza Muzzarella, Café con leche..."
            className={`w-full px-3 py-2 text-sm rounded-xl border ${
              errors.description
                ? "border-rose-500 focus:ring-rose-500"
                : "border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
            } bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500 font-medium">
              {errors.description}
            </p>
          )}
        </div>

        {/* Cantidad con Stepper Táctil */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Cantidad *
          </label>
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent font-bold"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? 1 : Math.max(1, val));
              }}
              className="w-full text-center text-sm font-semibold bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              className="w-9 h-9 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        {/* Precio Unitario */}
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Precio Unitario ({currencySymbol}) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={unitPriceInput}
            onChange={(e) => {
              setUnitPriceInput(e.target.value);
              if (errors.unitPrice) {
                setErrors((prev) => ({ ...prev, unitPrice: undefined }));
              }
            }}
            placeholder="0.00"
            className={`w-full px-3 py-2 text-sm rounded-xl border ${
              errors.unitPrice
                ? "border-rose-500 focus:ring-rose-500"
                : "border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
            } bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
          />
          {errors.unitPrice && (
            <p className="mt-1 text-xs text-rose-500 font-medium">
              {errors.unitPrice}
            </p>
          )}
        </div>
      </div>

      {/* Categoría y Previsualización de Total */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">
            Categoría:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                category === cat
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 self-end sm:self-auto">
          <span>Total estimado:</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(estimatedTotal, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <span>+ Agregar a la lista</span>
        </button>
      </div>
    </form>
  );
}
