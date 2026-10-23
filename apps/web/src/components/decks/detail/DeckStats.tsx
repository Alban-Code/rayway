import type { DeckCardDto } from "@/api/decks"
import { categoryCounts, counterHistogram } from "@/lib/deckGrouping"
import { CostCurve } from "./CostCurve"

const CATEGORY_LABELS = {
    Character: "Personnages",
    Event: "Events",
    Stage: "Stages",
} as const

type DeckStatsProps = {
    cards: DeckCardDto[]
}

function StatTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="deck-stat">
            <span className="deck-stat__value">{value}</span>
            <span className="deck-stat__label">{label}</span>
        </div>
    )
}

export function DeckStats({ cards }: DeckStatsProps) {
    const categories = categoryCounts(cards)
    const counters = counterHistogram(cards)

    return (
        <div className="deck-stats">
            <section className="deck-stats__section">
                <h2 className="deck-stats__title">Répartition</h2>
                <div className="deck-stats__tiles">
                    <StatTile label={CATEGORY_LABELS.Character} value={categories.Character} />
                    <StatTile label={CATEGORY_LABELS.Event} value={categories.Event} />
                    <StatTile label={CATEGORY_LABELS.Stage} value={categories.Stage} />
                </div>
            </section>

            <section className="deck-stats__section">
                <h2 className="deck-stats__title">Courbe de coût</h2>
                <CostCurve cards={cards} />
            </section>

            <section className="deck-stats__section">
                <h2 className="deck-stats__title">Counters</h2>
                <div className="deck-stats__tiles">
                    {counters.map((bucket) => (
                        <StatTile
                            key={bucket.value}
                            label={bucket.value === 0 ? "0" : `+${bucket.value}`}
                            value={bucket.count}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
