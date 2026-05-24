import type { CSSProperties } from "react";

type CardColor = "RED" | "BLUE" | "PURPLE" | "YELLOW"

function idStyle(color: CardColor): CSSProperties {
    const map: Record<CardColor, string> = {
        RED: "var(--id-red)",
        BLUE: "var(--id-blue)",
        PURPLE: "var(--id-purple)",
        YELLOW: "var(--id-yellow)",
    }

    return { ["--id-color" as string]: map[color] } as CSSProperties;
}

const HERO_TAGLINE = "OP02 META · LIVE"

type HeroCardData = {
    color: CardColor
    tag: string
    cost: number
    name: string
    code: string
    position: "hc1" | "hc2" | "hc3" | "hc4"
}

function HeroCard({ color, tag, cost, name, code, position }: HeroCardData) {
    return (
        <div className={`hc ${position}`} style={idStyle(color)}>
            <div className="top-bar" />
            <div className="art" />
            <div className="ttag">{tag}</div>
            <div className="cost">{cost}</div>
            <div className="nm">{name}</div>
            <div className="cd">{code}</div>
        </div>
    )
}

const HERO_CARDS: HeroCardData[] = [
    { color: "RED", tag: "LEADER", cost: 5, name: "Monkey D. Luffy", code: "OP01-001", position: "hc1" },
    { color: "BLUE", tag: "CH", cost: 4, name: "Cavendish", code: "OP02-014", position: "hc2" },
    { color: "PURPLE", tag: "CH", cost: 4, name: "Boa Hancock", code: "OP03-077", position: "hc3" },
    { color: "YELLOW", tag: "CH", cost: 5, name: "Yamato", code: "OP03-020", position: "hc4" },
]

export function AuthHero() {
    return (
        <aside className="auth-hero">
            <div className="auth-brand">
                <img className="mark" src="/assets/rayway-mark.svg" alt="Rayway" />
                <div className="wm">Rayway</div>
            </div>
            <div className="hero-copy">
                <div className="eyebrow">
                    <span className="dot" />
                    {HERO_TAGLINE}
                </div>
                <h1>
                    Build sharper decks{" "}
                    <span className="accent">with a coach in the room</span>
                </h1>
                <p>
                    Rayway is a card library, deckbuilder, and AI sparring partner — wrapped in one keystroke.
                    Drop a list, ask for a counter, simulate a thousand games before sleeve-up.
                </p>
            </div>
            <div className="hero-stats">
                <div className="s">
                    <div className="v"><span className="em">2,140</span></div>
                    <div className="l">cards indexed</div>
                </div>
                <div className="s">
                    <div className="v">
                        18 <span style={{ fontSize: 16, color: "var(--fg-3)" }}>archetypes</span>
                    </div>
                    <div className="l">live meta</div>
                </div>
                <div className="s">
                    <div className="v">⌘K</div>
                    <div className="l">everywhere</div>
                </div>
            </div>
            <div className="hero-pile">
                {HERO_CARDS.map((card) => (<HeroCard key={card.code} {...card} />))}
            </div>
        </aside>
    )
}