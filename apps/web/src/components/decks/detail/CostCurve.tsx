import type { DeckCardDto } from "@/api/decks"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { costHistogram } from "@/lib/deckGrouping"
import { Bar, BarChart, XAxis } from "recharts"

// The bar color resolves to the deck identity (--id-color-a, set on
// .deck-detail) and falls back to the theme's first chart hue.
const chartConfig = {
    count: { label: "Cartes", color: "var(--id-color-a, var(--chart-1))" },
} satisfies ChartConfig

type CostCurveProps = {
    cards: DeckCardDto[]
}

export function CostCurve({ cards }: CostCurveProps) {
    const data = costHistogram(cards)

    return (
        <ChartContainer config={chartConfig} className="cost-curve">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
}
