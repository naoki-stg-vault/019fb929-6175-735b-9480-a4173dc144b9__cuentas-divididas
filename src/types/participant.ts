export interface Participant {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

export interface ParticipantColorOption {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  selectedRingClass: string;
}

export const PARTICIPANT_PALETTE: ParticipantColorOption[] = [
  {
    id: "emerald",
    name: "Esmeralda",
    hex: "#10b981",
    bgClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-300 dark:border-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    selectedRingClass: "ring-emerald-500",
  },
  {
    id: "blue",
    name: "Azul",
    hex: "#3b82f6",
    bgClass: "bg-blue-500",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-300 dark:border-blue-700",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    selectedRingClass: "ring-blue-500",
  },
  {
    id: "purple",
    name: "Púrpura",
    hex: "#a855f7",
    bgClass: "bg-purple-500",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-300 dark:border-purple-700",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    selectedRingClass: "ring-purple-500",
  },
  {
    id: "amber",
    name: "Ámbar",
    hex: "#f59e0b",
    bgClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-300 dark:border-amber-700",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    selectedRingClass: "ring-amber-500",
  },
  {
    id: "rose",
    name: "Rosa",
    hex: "#f43f5e",
    bgClass: "bg-rose-500",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-300 dark:border-rose-700",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    selectedRingClass: "ring-rose-500",
  },
  {
    id: "cyan",
    name: "Cian",
    hex: "#06b6d4",
    bgClass: "bg-cyan-500",
    textClass: "text-cyan-700 dark:text-cyan-300",
    borderClass: "border-cyan-300 dark:border-cyan-700",
    badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800",
    selectedRingClass: "ring-cyan-500",
  },
  {
    id: "orange",
    name: "Naranja",
    hex: "#f97316",
    bgClass: "bg-orange-500",
    textClass: "text-orange-700 dark:text-orange-300",
    borderClass: "border-orange-300 dark:border-orange-700",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800",
    selectedRingClass: "ring-orange-500",
  },
  {
    id: "indigo",
    name: "Índigo",
    hex: "#6366f1",
    bgClass: "bg-indigo-500",
    textClass: "text-indigo-700 dark:text-indigo-300",
    borderClass: "border-indigo-300 dark:border-indigo-700",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
    selectedRingClass: "ring-indigo-500",
  },
];

export function getParticipantColor(colorIdOrHex?: string, indexFallback = 0): ParticipantColorOption {
  if (colorIdOrHex) {
    const found = PARTICIPANT_PALETTE.find(
      (c) => c.id === colorIdOrHex.toLowerCase() || c.hex.toLowerCase() === colorIdOrHex.toLowerCase()
    );
    if (found) return found;
  }
  return PARTICIPANT_PALETTE[indexFallback % PARTICIPANT_PALETTE.length];
}

export function getParticipantInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
