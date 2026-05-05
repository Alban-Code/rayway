import 'dotenv/config';
import { PrismaClient, Color, CardType } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ---------------------------------------------------------------------------
// Types API
// ---------------------------------------------------------------------------

interface ApiCard {
    card_set_id: string;
    card_name: string;
    set_id: string;
    set_name: string;
    card_type: string;
    card_color: string;
    card_cost: string | null;
    card_power: string | null;
    life: string | null;
    counter_amount: number | null;
    attribute: string | null;
    rarity: string;
    sub_types: string | null;
    card_text: string | null;
    card_image_id: string;
    card_image: string;
    market_price: number | null;
    inventory_price: number | null;
    is_starter?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, Color> = {
    Red: Color.Red,
    Blue: Color.Blue,
    Green: Color.Green,
    Black: Color.Black,
    Yellow: Color.Yellow,
    Purple: Color.Purple,
};

const CARD_TYPE_MAP: Record<string, CardType> = {
    Leader: CardType.Leader,
    Character: CardType.Character,
    Event: CardType.Event,
    Stage: CardType.Stage,
};

function parseColors(raw: string): Color[] {
    if (!raw || raw === 'DON!!') return [];
    return raw
        .split(' ')
        .map((c) => COLOR_MAP[c])
        .filter((c): c is Color => c !== undefined);
}

function parseCardType(raw: string): CardType | null {
    return CARD_TYPE_MAP[raw] ?? null;
}

/** Regroupe les entrées API par card_set_id (code de base, sans suffixe _p1, _p2…) */
function groupByBaseCode(entries: ApiCard[]): Map<string, ApiCard[]> {
    const map = new Map<string, ApiCard[]>();
    for (const entry of entries) {
        // Le code de base est toujours le card_set_id de la variante principale
        // On déduit le code de base depuis l'image id : OP01-001_p1 → OP01-001
        const baseCode = entry.card_set_id;
        if (!map.has(baseCode)) map.set(baseCode, []);
        map.get(baseCode)!.push(entry);
    }
    return map;
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('📦 Fetching data from OPTCG API…');

        const [setCards, stCards] = await Promise.all([
            fetchJson<ApiCard[]>('https://optcgapi.com/api/allSetCards/'),
            fetchJson<ApiCard[]>('https://optcgapi.com/api/allSTCards/').then((cards) =>
                cards.map((c) => ({ ...c, is_starter: true })),
            ),
        ]);

        const allCards = [...setCards, ...stCards];
        console.log(`✅ ${allCards.length} raw entries fetched`);

        // Grouper par card_set_id — chaque groupe = 1 Card + N CardVariant
        const grouped = groupByBaseCode(allCards);
        console.log(`🃏 ${grouped.size} unique cards to import`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const [code, variants] of grouped) {
            try {
                // La variante principale = celle dont card_image_id === card_set_id
                const main = variants.find((v) => v.card_image_id === code) ?? variants[0];

                const cardType = parseCardType(main.card_type);
                if (!cardType) {
                    console.warn(`⚠️  Unknown card type "${main.card_type}" for ${code} — skipping`);
                    skipped++;
                    continue;
                }

                const colors = parseColors(main.card_color);
                const isDon = main.card_type === 'DON!!';

                // Upsert Card
                await prisma.card.upsert({
                    where: { code },
                    update: {
                        name: main.card_name,
                        setId: main.set_id,
                        setName: main.set_name,
                        type: cardType,
                        colors,
                        cost: main.card_cost ? parseInt(main.card_cost) : null,
                        power: main.card_power ? parseInt(main.card_power) : null,
                        life: main.life ? parseInt(main.life) : null,
                        counterAmount: main.counter_amount ?? null,
                        attribute: main.attribute ?? null,
                        rarity: main.rarity,
                        subTypes: main.sub_types ?? null,
                        effect: main.card_text ?? null,
                        isDon,
                    },
                    create: {
                        code,
                        name: main.card_name,
                        setId: main.set_id,
                        setName: main.set_name,
                        type: cardType,
                        colors,
                        cost: main.card_cost ? parseInt(main.card_cost) : null,
                        power: main.card_power ? parseInt(main.card_power) : null,
                        life: main.life ? parseInt(main.life) : null,
                        counterAmount: main.counter_amount ?? null,
                        attribute: main.attribute ?? null,
                        rarity: main.rarity,
                        subTypes: main.sub_types ?? null,
                        effect: main.card_text ?? null,
                        isDon,
                    },
                });

                // Upsert CardVariants
                for (const variant of variants) {
                    const isAlternate = variant.card_image_id !== code;
                    const isStarter = variant.is_starter ?? false;

                    await prisma.cardVariant.upsert({
                        where: { imageId: variant.card_image_id },
                        update: {
                            imageUrl: variant.card_image,
                            isPromo: false,
                            isStarter,
                            isAlternate,
                            marketPrice: variant.market_price ?? null,
                            inventoryPrice: variant.inventory_price ?? null,
                        },
                        create: {
                            imageId: variant.card_image_id,
                            imageUrl: variant.card_image,
                            isPromo: false,
                            isStarter,
                            isAlternate,
                            marketPrice: variant.market_price ?? null,
                            inventoryPrice: variant.inventory_price ?? null,
                            card: { connect: { code } },
                        },
                    });
                }

                created++;
                if (created % 100 === 0) {
                    console.log(`  → ${created}/${grouped.size} cards imported…`);
                }
            } catch (err) {
                console.error(`❌ Error on ${code}:`, err);
                errors++;
            }
        }

        console.log('\n✅ Migration complete!');
        console.log(`   Created/updated : ${created}`);
        console.log(`   Skipped         : ${skipped}`);
        console.log(`   Errors          : ${errors}`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});