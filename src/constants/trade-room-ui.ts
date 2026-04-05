/** Card chrome matching institutional / trade room panels (borders, panel bg, text). */
export const TRADE_ROOM_CARD_CLASS =
  'border border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)] shadow-none py-4 gap-4';

/**
 * Positions table nested under the trade room tab strip: no inner card frame so tabs + table read as one panel.
 */
export const TRADE_ROOM_EMBEDDED_TABLE_CARD_CLASS =
  'rounded-none border-0 bg-transparent py-0 shadow-none gap-0 text-[var(--trade-text)]';
