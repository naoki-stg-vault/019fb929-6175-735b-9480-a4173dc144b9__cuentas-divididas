"use client";

import React from "react";
import { Participant, getParticipantColor, getParticipantInitials } from "@/types/participant";

export interface ParticipantBadgeProps {
  participant: Participant;
  colorIndex?: number;
  isSelected?: boolean;
  isSelectable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  amountLabel?: string;
  shareLabel?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function ParticipantBadge({
  participant,
  colorIndex = 0,
  isSelected = false,
  isSelectable = false,
  onClick,
  onRemove,
  onEdit,
  amountLabel,
  shareLabel,
  size = "md",
  disabled = false,
  className = "",
}: ParticipantBadgeProps) {
  const color = getParticipantColor(participant.color, colorIndex);
  const initials = getParticipantInitials(participant.name);

  // Size specific styles
  const sizeStyles = {
    sm: {
      container: "px-2 py-0.5 text-xs gap-1.5",
      avatar: "w-5 h-5 text-[10px]",
      removeBtn: "w-3.5 h-3.5 ml-0.5",
    },
    md: {
      container: "px-2.5 py-1 text-xs sm:text-sm gap-2",
      avatar: "w-6 h-6 text-xs",
      removeBtn: "w-4 h-4 ml-1",
    },
    lg: {
      container: "px-3.5 py-1.5 text-sm sm:text-base gap-2.5",
      avatar: "w-8 h-8 text-sm",
      removeBtn: "w-5 h-5 ml-1.5",
    },
  }[size];

  // Visual state styling
  const stateClasses = isSelectable
    ? isSelected
      ? `${color.badgeClass} ring-2 ${color.selectedRingClass} shadow-xs font-semibold`
      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60 opacity-60 hover:opacity-100 hover:border-zinc-300"
    : `${color.badgeClass} font-medium`;

  const interactive = isSelectable || Boolean(onClick);

  return (
    <div
      role={isSelectable ? "checkbox" : onClick ? "button" : undefined}
      aria-checked={isSelectable ? isSelected : undefined}
      tabIndex={interactive && !disabled ? 0 : undefined}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center rounded-full border transition-all select-none ${
        interactive ? "cursor-pointer active:scale-95" : ""
      } ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""} ${sizeStyles.container} ${stateClasses} ${className}`}
      data-testid={`participant-badge-${participant.id}`}
    >
      {/* Avatar with Initials */}
      <span
        className={`flex items-center justify-center font-bold text-white rounded-full shrink-0 shadow-2xs ${color.bgClass} ${sizeStyles.avatar}`}
        aria-hidden="true"
      >
        {initials}
      </span>

      {/* Name */}
      <span className="truncate max-w-[120px] sm:max-w-[160px]">
        {participant.name}
      </span>

      {/* Optional Share / Portion tag */}
      {shareLabel && (
        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-white/70 dark:bg-black/40 text-zinc-700 dark:text-zinc-200">
          {shareLabel}
        </span>
      )}

      {/* Optional Amount tag */}
      {amountLabel && (
        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-white/80 dark:bg-black/50 text-emerald-700 dark:text-emerald-300">
          {amountLabel}
        </span>
      )}

      {/* Optional Edit button */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 rounded"
          title={`Editar ${participant.name}`}
          aria-label={`Editar ${participant.name}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      {/* Optional Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`flex items-center justify-center rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors ${sizeStyles.removeBtn}`}
          title={`Eliminar ${participant.name}`}
          aria-label={`Eliminar participante ${participant.name}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
