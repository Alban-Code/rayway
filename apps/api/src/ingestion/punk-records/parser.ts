// ─────────────────────────────────────────────────────────────────────────────
// Parse les fichiers JSON punk-records et normalise vers nos enums Prisma.
//
// Le but : isoler ici TOUTE la connaissance du format externe. Le reste du
// code ne manipule QUE nos types internes (avec nos enums Color, CardType…).
// Si punk-records change demain, on ne touche que ce fichier.
// ─────────────────────────────────────────────────────────────────────────────

import { readFile } from 'node:fs/promises';
import {
  Color,
  Category,
  Attribute,
  Rarity,
} from '../../generated/prisma/enums.js';
import type { PunkCard } from './types.js';

/**
 * Forme normalisée d'une carte, prête à être upserted.
 * C'est la "carte canonique" : pas de notion de langue ici (sauf le code ISO
 * de la langue source du fichier qu'on a lu, pour la translation).
 */
export interface NormalizedCard {
  code: string;                  // "OP01-001"
  setCode: string;               // "OP01" — extrait du préfixe de `code`
  category: Category;
  colors: Color[];
  cost: number | null;
  power: number | null;
  life: number | null;
  counterAmount: number | null;
  attributes: Attribute[];
  rarity: Rarity;

  typeCodes: string[];       // slugs ("straw-hat-crew", …) — valides uniquement en EN

  // Traduction dans la langue du fichier lu
  translation: {
    languageCode: string;        // "en" | "fr" | ...
    name: string;
    effect: string | null;
    triggerEffect: string | null;
    typeLabels: string[];        // labels DANS L'ORDRE des typeCodes (position-matching EN↔FR)
  };

  // Variantes (printings) de cette carte
  variants: NormalizedVariant[];
}

export interface NormalizedVariant {
  variantCode: string;            // "OP01-001", "OP01-001_p1", "OP01-001_r1"
  variantType: 'Regular' | 'Parallel' | 'Reprint'; // dérivé du suffixe
  isPromo: boolean;
  isStarter: boolean;
  imageUrl: string;
  // Pas de marketPrice/inventoryPrice : punk-records ne les fournit pas.
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrée principale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lit et parse un fichier `<lang>/cards/<CODE>.json`.
 *
 * @param filePath chemin absolu vers le JSON
 * @param languageCode notre code ISO ("en", "fr", ...)
 */
export async function parseCardFile(
  filePath: string,
  languageCode: string,
): Promise<NormalizedCard> {
  const raw = await readFile(filePath, 'utf-8');
  const json = JSON.parse(raw) as PunkCard;
  return normalize(json, languageCode);
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation : punk-records → nos types
// ─────────────────────────────────────────────────────────────────────────────

function normalize(card: PunkCard, languageCode: string): NormalizedCard {
  const isLeader = card.category === 'Leader';
  const setCode = card.id.split('-')[0];

  return {
    code: card.id.split('_')[0],
    setCode,
    category: CARD_CATEGORY_MAP[card.category],
    colors: card.colors.map((c) => COLOR_MAP[c]),
    attributes: card.attributes
      .filter((a) => !ATTRIBUTE_IGNORE.has(a))
      .map(mapAttribute),
    rarity: RARITY_MAP[card.rarity],
    cost: isLeader ? null : card.cost,
    life: isLeader ? card.cost : null,
    counterAmount: card.counter,
    power: card.power,
    typeCodes: card.types.map(slugifyType),
    translation: {
      languageCode,
      name: card.name,
      effect: card.effect,
      triggerEffect: card.trigger,
      typeLabels: card.types,
    },
    variants: [
      {
        variantCode: card.id,
        variantType: classifyVariant(card.id),
        isPromo: card.rarity === 'Promo',
        isStarter: setCode.startsWith('ST'),
        imageUrl: card.img_full_url,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — un par champ, faciles à tester unitairement
// ─────────────────────────────────────────────────────────────────────────────

/** "OP01-001_p1" → "Parallel", "OP01-001_r1" → "Reprint", sinon "Regular". */
export function classifyVariant(variantCode: string): NormalizedVariant['variantType'] {
  if (/_p\d+$/.test(variantCode)) return 'Parallel';
  if (/_r\d+$/.test(variantCode)) return 'Reprint';
  return 'Regular';
}

/**
 * Slugifie un libellé EN de Type en code canonique.
 * Ex: "Straw Hat Crew" → "straw-hat-crew", "Whole Cake Island" → "whole-cake-island".
 *
 * IMPORTANT: les codes ne sont stables QU'EN ANGLAIS. En pass 2 (FR),
 * on attache les TypeTranslation par POSITION dans le tableau, pas par slug.
 */
export function slugifyType(label: string): string {
  return label
    .normalize('NFD')                  // "Équipage" → "Équipage" (sépare accent et lettre)
    .replace(/[̀-ͯ]/g, '')   // supprime les marques d'accent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')       // tout caractère non-alphanum → '-'
    .replace(/^-+|-+$/g, '');          // trim les '-' aux extrémités
}

// Maps de normalisation — à compléter en regardant un fichier réel.
// Mettre QUE les valeurs qu'on a observées dans le dataset.

export const COLOR_MAP: Record<string, Color> = {
  "Red": Color.Red,
  "Green": Color.Green,
  "Blue": Color.Blue,
  "Purple": Color.Purple,
  "Yellow": Color.Yellow,
  "Black": Color.Black
};

export const CARD_CATEGORY_MAP: Record<string, Category> = {
  "Leader": Category.Leader,
  "Character": Category.Character,
  "Event": Category.Event,
  "Stage": Category.Stage,
  "Don": Category.Don
};

export const RARITY_MAP: Record<string, Rarity> = {
  "Common": Rarity.C,
  "Uncommon": Rarity.UC,
  "Rare": Rarity.R,
  "SuperRare": Rarity.SR,
  "Leader": Rarity.L,
  "SecretRare": Rarity.SEC,
  "Special": Rarity.SP,
  "TreasureRare": Rarity.TR,
  "Promo": Rarity.P
};

export const ATTRIBUTE_MAP: Record<string, Attribute> = {
  "Slash": Attribute.Slash,
  "Strike": Attribute.Strike,
  "Ranged": Attribute.Ranged,
  "Special": Attribute.Special,
  "Wisdom": Attribute.Wisdom
};

// Valeurs Bandai qu'on traite comme "pas d'attribut" plutôt qu'erreur.
// "Unknown" apparaît sur certains Leaders (ex: OP13-079) qui n'ont pas
// d'attribut de combat — on les filtre, l'array `attributes` finit juste vide.
export const ATTRIBUTE_IGNORE = new Set<string>(["Unknown"]);

/** Mappe une valeur d'attribut Bandai vers notre enum, en throw si valeur inconnue. */
export function mapAttribute(src: string): Attribute {
  const mapped = ATTRIBUTE_MAP[src];
  if (mapped === undefined) {
    throw new Error(`Unknown attribute "${src}" — add to ATTRIBUTE_MAP or ATTRIBUTE_IGNORE.`);
  }
  return mapped;
}
