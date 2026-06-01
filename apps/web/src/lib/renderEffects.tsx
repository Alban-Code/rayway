import type { ReactNode } from "react";

const ENTITIES: Record<string, string> = {
    "&nbsp;": "\u00A0",
    "&lt;": "<",
    "&gt;": ">",
}

function decode(s: string): string {
    return s.replace(/&nbsp;|&lt;|&gt;/g, (m) => ENTITIES[m] ?? m)
}

export function renderEffect(raw: string): ReactNode {
    // 1) <br> → \n  (le <p> garde whitespace-pre-line pour les afficher)
    const text = raw.replace(/<br\s*\/?>/gi, "\n")

    // 2) découpe en GARDANT les tokens (grâce au groupe capturant ( ) )
    //    "[Jouée] foo {Tribu}" → ["", "[Jouée]", " foo ", "{Tribu}", ""]
    const parts = text.split(/(\[[^\]]+\]|\{[^}]+\})/)

    // 3) chaque morceau → soit une string (texte), soit un <span> stylé
    return parts.map((part, i) => {
        // {Tribu} → exemple COMPLET
        if (part.startsWith("{")) {
            return (
                <span key={i} className="fx-type">
                    {decode(part.slice(1, -1))}
                </span>
            )
        }

        if (part.startsWith("[")) {
            const inner = part.slice(1, -1)
            const isDon = inner.includes("DON!!")
            return (
                <span key={i} className={isDon ? "fx-kw fx-kw--don" : "fx-kw"}>
                    {decode(inner)}
                </span>
            )
        }

        return decode(part)
    })
}