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
    name: "Caramelo",
    hex: "#9e7f5b",
    bgClass: "bg-[#9e7f5b]",
    textClass: "text-[#543d26] dark:text-[#f4ecdf]",
    borderClass: "border-[#d0b89b] dark:border-[#886944]",
    badgeClass: "bg-[#f2e9dc] text-[#543d26] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#d0b89b] dark:border-[#645545]",
    selectedRingClass: "ring-[#9e7f5b]",
  },
  {
    id: "blue",
    name: "Arena",
    hex: "#a08157",
    bgClass: "bg-[#a08157]",
    textClass: "text-[#4f3920] dark:text-[#f1e8d7]",
    borderClass: "border-[#dfd1bd] dark:border-[#85673f]",
    badgeClass: "bg-[#f1e8d7] text-[#4f3920] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#dfd1bd] dark:border-[#645545]",
    selectedRingClass: "ring-[#a08157]",
  },
  {
    id: "purple",
    name: "Moka",
    hex: "#826c50",
    bgClass: "bg-[#826c50]",
    textClass: "text-[#483c2f] dark:text-[#f4ecdf]",
    borderClass: "border-[#d3c0a5] dark:border-[#68543d]",
    badgeClass: "bg-[#f4ecdf] text-[#483c2f] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#d3c0a5] dark:border-[#645545]",
    selectedRingClass: "ring-[#826c50]",
  },
  {
    id: "amber",
    name: "Tostado",
    hex: "#b88235",
    bgClass: "bg-[#b88235]",
    textClass: "text-[#583713] dark:text-[#f9edd5]",
    borderClass: "border-[#f1d8ab] dark:border-[#986626]",
    badgeClass: "bg-[#f9edd5] text-[#583713] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#f1d8ab] dark:border-[#645545]",
    selectedRingClass: "ring-[#b88235]",
  },
  {
    id: "rose",
    name: "Lino Rosa",
    hex: "#ab7361",
    bgClass: "bg-[#ab7361]",
    textClass: "text-[#5d3226] dark:text-[#f3e6e1]",
    borderClass: "border-[#e8cfc6] dark:border-[#925848]",
    badgeClass: "bg-[#f3e6e1] text-[#5d3226] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#e8cfc6] dark:border-[#645545]",
    selectedRingClass: "ring-[#ab7361]",
  },
  {
    id: "cyan",
    name: "Almendra",
    hex: "#9c8974",
    bgClass: "bg-[#9c8974]",
    textClass: "text-[#493d31] dark:text-[#faf7f2]",
    borderClass: "border-[#d8cbb8] dark:border-[#7f6e5b]",
    badgeClass: "bg-[#f4eee5] text-[#493d31] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#d8cbb8] dark:border-[#645545]",
    selectedRingClass: "ring-[#9c8974]",
  },
  {
    id: "orange",
    name: "Canela",
    hex: "#a37648",
    bgClass: "bg-[#a37648]",
    textClass: "text-[#4f3118] dark:text-[#f6ede3]",
    borderClass: "border-[#dec09a] dark:border-[#7b5128]",
    badgeClass: "bg-[#f6ede3] text-[#4f3118] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#dec09a] dark:border-[#645545]",
    selectedRingClass: "ring-[#a37648]",
  },
  {
    id: "indigo",
    name: "Avellana",
    hex: "#7a6752",
    bgClass: "bg-[#7a6752]",
    textClass: "text-[#3e3020] dark:text-[#f4ecdf]",
    borderClass: "border-[#baa485] dark:border-[#60503f]",
    badgeClass: "bg-[#ede4d5] text-[#3e3020] dark:bg-[#493d31] dark:text-[#f4eee5] border-[#baa485] dark:border-[#645545]",
    selectedRingClass: "ring-[#7a6752]",
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
