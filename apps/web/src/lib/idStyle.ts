import type { Color } from "@/api/cards";
import type { CSSProperties } from "react";

const COLORS_VARS: Record<Color, string> = {
    Red: 'var(--id-red)',
    Green: 'var(--id-green)',
    Blue: 'var(--id-blue)',
    Purple: 'var(--id-purple)',
    Black: 'var(--id-black)',
    Yellow: 'var(--id-yellow)',
}

export function idColorStyle(colors: Color[]): CSSProperties {
    const a = colors[0] ? COLORS_VARS[colors[0]] : "var(--accent)"
    const b = colors[1] ? COLORS_VARS[colors[1]] : a

    return { '--id-color-a': a, '--id-color-b': b } as CSSProperties
}