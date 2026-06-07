import type { Color } from "@/api/cards"

/**
 * Token CSS (OKLCH) de la couleur d'identité d'une carte.
 * Source unique consommée par les filtres, les chips actives et le détail.
 */
export const COLOR_VARS: Record<Color, string> = {
    Red: 'var(--id-red)',
    Green: 'var(--id-green)',
    Blue: 'var(--id-blue)',
    Purple: 'var(--id-purple)',
    Black: 'var(--id-black)',
    Yellow: 'var(--id-yellow)',
}
