/** Keyboard focus ring for desktop web (mouse clicks skip via focus-visible). */
export const INTERACTIVE_FOCUS =
  "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";

/** Sidebar rows and bottom tab items — teal-tinted hover on fine pointer. */
export const INTERACTIVE_NAV = `${INTERACTIVE_FOCUS} active:bg-accent-soft fine-hover:bg-accent-soft fine-hover:shadow-sm transition-colors duration-200`;

/** Primary buttons — opacity hover on fine pointer; active press for touch. */
export const INTERACTIVE_PRIMARY = `${INTERACTIVE_FOCUS} active:opacity-90 fine-hover:opacity-90 transition-opacity duration-150`;

/** Secondary/destructive buttons — focus ring + touch press only (no hover opacity). */
export const INTERACTIVE_BUTTON = `${INTERACTIVE_FOCUS} active:opacity-90`;

/** Card visual feedback when parent Pressable has `group`. */
export const INTERACTIVE_CARD =
  "fine-group-hover:bg-accent-soft/50 fine-group-hover:shadow-md transition-all duration-200 shadow-sm";

/** Pressable wrapper for NavCard and other interactive cards. */
export const INTERACTIVE_CARD_PRESSABLE = `${INTERACTIVE_FOCUS} group active:opacity-95`;
