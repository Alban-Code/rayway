import { CATEGORIES, COLORS, type Category } from "@/api/cards";
import { useCardsFilter } from "@/lib/hooks/useCardsFilter";

export function CardFilters() {
    const { colors, category, handleColorClick, setCategoryFilter } = useCardsFilter()

    return (
        <aside className="filters-col">
            <div className="head">
                <h2>Filters</h2>
            </div>

            <div className="filter-block">
                <div className="label">Colors</div>
                <div className="chip-grid">
                    {COLORS.map((c) => {
                        const active = colors.includes(c);
                        const upper = c.toUpperCase();  // 'Red' → 'RED'
                        return (
                            <button
                                key={c}
                                type="button"
                                className={`chip identity id-${upper}${active ? ' on' : ''}`}
                                onClick={() => handleColorClick(c)}
                            >
                                <span className="dot" />{upper}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="filter-block">
                <div className="label">Type</div>
                <div className="chip-grid">
                    {CATEGORIES.map((cat) => {
                        const active = category === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                className={`chip${active ? ' on' : ''}`}
                                onClick={() => setCategoryFilter(active ? undefined : cat)}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>)
}