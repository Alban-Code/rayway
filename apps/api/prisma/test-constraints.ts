import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    // Crée une carte et un deck de test
    const card = await prisma.card.create({
        data: {
            code: "TEST-001",
            name: "Test Card",
            setId: "TEST",
            setName: "Test Set",
            type: "Character",
            colors: ["Red"],
            rarity: "C",
            isDon: false,
            updatedAt: new Date(),
            variants: {
                create: {
                    imageId: "test",
                    imageUrl: "http://test.com",
                },
            },
        },
    });

    const deck = await prisma.deck.create({
        data: {
            name: "Test Deck",
            leaderId: card.id,
            leaderColors: ["Red"],
        },
    });

    // ─── Test 1 : quantité > 4 ────────────────────────────────────────────────
    console.log("Test 1 : quantité > 4...");
    try {
        await prisma.deckCard.create({
            data: {
                deckId: deck.id,
                variantId: card.id,
                quantity: 5,
            },
        });
        console.log("❌ Test 1 échoué — la contrainte n'a pas bloqué");
    } catch (e) {
        console.log("✅ Test 1 réussi — quantité > 4 bloquée");
    }

    // ─── Test 2 : deck > 50 cartes ────────────────────────────────────────────
    console.log("Test 2 : deck > 50 cartes...");
    try {
        await prisma.deckCard.create({
            data: {
                deckId: deck.id,
                variantId: card.id,
                quantity: 51,
            },
        });
        console.log("❌ Test 2 échoué — la contrainte n'a pas bloqué");
    } catch (e) {
        console.log("✅ Test 2 réussi — deck > 50 cartes bloqué");
    }

    // ─── Test 3 : carte rouge dans deck rouge ─────────────────────────────────
    console.log("Test 3 : carte rouge compatible avec deck rouge...");
    try {
        await prisma.deckCard.create({
            data: {
                deckId: deck.id,
                variantId: card.id,
                quantity: 1,
            },
        });
        console.log("✅ Test 3 réussi — carte compatible ajoutée");
    } catch (e) {
        console.log("❌ Test 3 échoué :", e);
    }

    // ─── Nettoyage ────────────────────────────────────────────────────────────
    await prisma.deckCard.deleteMany({ where: { deckId: deck.id } });
    await prisma.deck.delete({ where: { id: deck.id } });
    await prisma.cardVariant.deleteMany({ where: { cardId: card.id } });
    await prisma.card.delete({ where: { id: card.id } });
    console.log("\n🧹 Données de test supprimées");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());