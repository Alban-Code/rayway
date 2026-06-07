// ─────────────────────────────────────────────────────────────────────────────
// Écriture en base : applique une `NormalizedCard` sur le schéma Prisma.
//
// C'est LE fichier qui te fera comprendre le schéma. Chaque méthode touche
// un ou deux modèles et les commentaires expliquent pourquoi.
//
// Règles d'or :
//  1. Idempotent : on doit pouvoir rejouer N fois sans dupliquer.
//     → toujours `upsert` sur le champ `@unique` "métier", JAMAIS sur l'`id` cuid.
//  2. Une carte = une transaction. Si une carte plante, les autres passent.
//  3. Les FK obligatoires (set, language) doivent exister AVANT l'upsert.
//     → c'est le rôle de `ensureLanguage` / `ensureSet`.
// ─────────────────────────────────────────────────────────────────────────────

import { log } from './logger.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { NormalizedCard } from './parser.js';

/**
 * Upsert qui respecte le flag `overridden` (champ booléen sur la row).
 *  - row absente            → on appelle `create`
 *  - row présente, !overridden → on appelle `update`
 *  - row présente, overridden  → on ne touche pas (édit admin protégé)
 *
 * Les 3 fonctions reçues sont des closures qui font l'appel Prisma effectif.
 * Ça évite de générifier sur les types Prisma (vite illisible) tout en gardant
 * le pattern factorisé.
 */
async function upsertRespectingOverride(
  find: () => Promise<{ overridden: boolean } | null>,
  create: () => Promise<unknown>,
  update: () => Promise<unknown>,
): Promise<void> {
  const existing = await find();
  if (!existing) {
    await create();
  } else if (!existing.overridden) {
    await update();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pré-requis : créer les lignes "parent" si elles n'existent pas encore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * S'assure que la ligne Language existe (PK = code ISO).
 * À appeler une fois par run, par langue traitée.
 *
 * Modèle visé : `Language { code @id, name }`
 */
export async function ensureLanguage(
  prisma: PrismaClient,
  code: string,
  name: string,
): Promise<void> {
  // `update: {}` = on ne touche à rien si la ligne existe déjà.
  // On NE veut PAS écraser un `name` que l'admin aurait pu retoucher à la main.
  await prisma.language.upsert({
    where: { code },
    update: {},
    create: { code, name },
  });
}

/**
 * S'assure que le CardSet existe.
 *
 * Modèle visé : `CardSet { id cuid, code @unique, name }`
 * Note : on upsert sur `code` (pas `id`) car `code` est le vrai identifiant métier.
 */
export async function ensureSet(
  prisma: PrismaClient,
  code: string,        // "OP01"
  name: string,        // pour l'instant on met le code aussi en `name` (on enrichira plus tard)
): Promise<string> {   // retourne l'id cuid du set
  const set = await prisma.cardSet.upsert({
    where: { code },
    update: {},
    create: { code, name },
    select: { id: true },
  });
  return set.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cœur du métier : upsert d'une carte normalisée
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applique une carte normalisée sur la DB. Tout se passe dans UNE transaction.
 *
 * Ce qui est touché :
 *  - Card                  (upsert sur `code`)
 *  - CardTranslation       (upsert sur `(cardId, languageCode)`)
 *  - Type                  (upsert sur `code`)         ← seulement en pass EN
 *  - TypeTranslation       (upsert sur `(typeId, languageCode)`)
 *  - CardType              (upsert sur `(cardId, typeId)`)
 *  - CardVariant           (upsert sur `variantCode`)
 *  - CardVariantImage      (upsert sur `(variantId, languageCode)`)
 *
 * @param isPrimaryLanguage true si c'est la langue qui définit les codes
 *        canoniques (EN dans notre cas). Si false : on ne crée PAS de
 *        Type/Card neuf, on ne fait qu'attacher des traductions.
 */
export async function upsertCard(
  prisma: PrismaClient,
  card: NormalizedCard,
  setIdsByCode: Map<string, string>,
  isPrimaryLanguage: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Étape 1 — la Card canonique (champs language-neutral)
    // TODO: tx.card.upsert où le where utilise `code`.
    //   - Si isPrimaryLanguage : on peut create avec tous les champs.
    //   - Sinon : on s'attend à ce que la carte existe déjà (créée par EN).
    //     Si elle n'existe pas, on log un warn et on skip (la FR ne doit pas
    //     créer une carte sans canonique EN — ça veut dire bug d'ordre).
    const canonicalFields = {
      category: card.category,
      rarity: card.rarity,
      attributes: card.attributes,
      colors: card.colors,
      power: card.power,
      life: card.life,
      counterAmount: card.counterAmount,
      cost: card.cost
    };

    let cardId: string;

    if (isPrimaryLanguage) {
      const setId = setIdsByCode.get(card.setCode);

      if (setId === undefined) {
        throw new Error(`Set ${card.setCode} not pre-loaded for card ${card.code}`);
      }

      const upserted = await tx.card.upsert({
        where: { code: card.code },
        create: {
          code: card.code,
          setId: setId,
          ...canonicalFields
        },
        update: canonicalFields,
        select: { id: true }
      });

      cardId = upserted.id;


    } else {
      const existing = await tx.card.findUnique({ where: { code: card.code }, select: { id: true } });

      if (!existing) {
        log.warn({ event: "card_skipped_no_canonical", code: card.code });
        return;
      }

      cardId = existing.id;
    }


    // Étape 2 — la translation
    const ctWhere = {
      cardId_languageCode: { cardId, languageCode: card.translation.languageCode },
    };
    const ctData = {
      name: card.translation.name,
      effect: card.translation.effect,
      triggerEffect: card.translation.triggerEffect,
    };
    await upsertRespectingOverride(
      () => tx.cardTranslation.findUnique({ where: ctWhere, select: { overridden: true } }),
      () => tx.cardTranslation.create({
        data: { cardId, languageCode: card.translation.languageCode, ...ctData },
      }),
      () => tx.cardTranslation.update({ where: ctWhere, data: ctData }),
    );

    // Étape 3 — types
    // TODO:
    //   - Si isPrimaryLanguage : pour chaque code de type, upsert Type,
    //     upsert TypeTranslation (langue courante), upsert CardType.
    //   - Sinon : pour chaque LABEL FR, retrouver le type par POSITION
    //     (les positions doivent matcher entre EN et FR — vérifié à l'usage),
    //     puis upsert TypeTranslation pour la langue courante.
    //   On reviendra ensemble sur le détail du position-matching.

    if (isPrimaryLanguage) {
      // Reset les types de cette carte pour éviter les conflits sur (cardId, order) quand
      // des variants du même Card déclarent des `types[]` différents (cas Bandai weird,
      // ex: ST11-005 régulier en JP labels vs ses parallels en EN labels). Sémantique :
      // "le fichier en cours est la source de vérité ; le dernier traité gagne".
      await tx.cardType.deleteMany({ where: { cardId } });

      for (let i = 0; i < card.typeCodes.length; i++) {
        const currentCode = card.typeCodes[i];
        const currentLabel = card.translation.typeLabels[i];

        const type = await tx.type.upsert({
          where: { code: currentCode },
          create: { code: currentCode },
          update: {},
          select: { id: true }
        });

        const ttWhereEn = {
          typeId_languageCode: { typeId: type.id, languageCode: card.translation.languageCode },
        };
        await upsertRespectingOverride(
          () => tx.typeTranslation.findUnique({ where: ttWhereEn, select: { overridden: true } }),
          () => tx.typeTranslation.create({
            data: { typeId: type.id, languageCode: card.translation.languageCode, label: currentLabel },
          }),
          () => tx.typeTranslation.update({ where: ttWhereEn, data: { label: currentLabel } }),
        );

        await tx.cardType.create({
          data: { cardId, typeId: type.id, order: i }
        });

      }

    } else {
      // On récupère les types de la carte en anglais et dans l'ordre
      const orderedTypes = await tx.cardType.findMany({
        where: { cardId },
        orderBy: { order: 'asc' },
        select: { type: { select: { id: true } } }
      });

      if (orderedTypes.length !== card.translation.typeLabels.length) {
        log.warn({
          event: 'type_arity_mismatch',
          code: card.code,
          en: orderedTypes.length,
          fr: card.translation.typeLabels.length,
        });
      } else {
        for (let i = 0; i < orderedTypes.length; i++) {
          const typeId = orderedTypes[i].type.id;
          const label = card.translation.typeLabels[i];
          const ttWhereFr = {
            typeId_languageCode: { typeId, languageCode: card.translation.languageCode },
          };
          await upsertRespectingOverride(
            () => tx.typeTranslation.findUnique({ where: ttWhereFr, select: { overridden: true } }),
            () => tx.typeTranslation.create({
              data: { typeId, languageCode: card.translation.languageCode, label },
            }),
            () => tx.typeTranslation.update({ where: ttWhereFr, data: { label } }),
          );
        }
      }


    }

    // Étape 4 — variantes
    // TODO: pour chaque variant :
    //   - upsert CardVariant sur variantCode (champs : variantType, isPromo,
    //     isStarter)
    //   - upsert CardVariantImage sur (variantId, languageCode) avec imageUrl
    for (const variant of card.variants) {
      const variantDb = await tx.cardVariant.upsert({
        where: {
          variantCode: variant.variantCode,
        },
        create: {
          variantCode: variant.variantCode,
          cardId,
          isPromo: variant.isPromo,
          variantType: variant.variantType,
          isStarter: variant.isStarter
        },
        update: {
          isPromo: variant.isPromo,
          variantType: variant.variantType,
          isStarter: variant.isStarter
        },
        select: {
          id: true
        }
      });

      await tx.cardVariantImage.upsert({
        where: {
          variantId_languageCode: {
            variantId: variantDb.id,
            languageCode: card.translation.languageCode,
          },
        },
        create: {
          variantId: variantDb.id,
          languageCode: card.translation.languageCode,
          sourceUrl: variant.sourceUrl,
          storageKey: variant.storageKey
        },
        update: {
          sourceUrl: variant.sourceUrl,
          storageKey: variant.storageKey
        },

      })
    }

  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Traçabilité du run
// ─────────────────────────────────────────────────────────────────────────────

export interface IngestionRunSummary {
  source: 'punk-records';
  commitSha: string;
  startedAt: Date;
  finishedAt: Date;
  filesProcessed: number;
  cardsUpserted: number;
  variantsUpserted: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

/** Enregistre un run dans la table IngestionRun (audit + état pour le diff incrémental). */
export async function recordRun(
  prisma: PrismaClient,
  summary: IngestionRunSummary,
): Promise<void> {
  // TODO: prisma.ingestionRun.create({ data: { ... } })
  // (le modèle sera ajouté au schema dans l'étape suivante.)
  await prisma.ingestionRun.create({ data: { ...summary } });
}

/** Récupère le SHA du dernier run RÉUSSI pour calculer le diff incrémental. */
export async function getLastSuccessfulSha(prisma: PrismaClient): Promise<string | null> {
  // TODO: prisma.ingestionRun.findFirst({
  //   where: { source: 'punk-records', status: 'success' },
  //   orderBy: { finishedAt: 'desc' },
  //   select: { commitSha: true },
  // }) → renvoyer .commitSha ?? null
  const last = await prisma.ingestionRun.findFirst({
    where: { source: "punk-records", status: "success" },
    orderBy: { finishedAt: "desc" },
    select: { commitSha: true }
  });

  return last?.commitSha ?? null;
}
