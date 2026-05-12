// ─────────────────────────────────────────────────────────────────────────────
// Types des fichiers JSON publiés par https://github.com/buhbbl/punk-records
//
// Le repo expose un dossier par langue : english/, french/, japanese/, ...
// Dans chaque dossier on a :
//   - cards/<CODE>.json       → une carte (toutes variantes confondues)
//   - packs/<pack_id>.json    → un "produit" Bandai (booster, starter…)
//
// On modélisera ici UNIQUEMENT ce dont on a besoin pour ingérer.
// Ne pas mapper 1:1 le JSON — ne déclarer que les champs qu'on lit.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Une carte telle que publiée par punk-records (un fichier `cards/<CODE>.json`).
 *
 * TODO: ouvrir un échantillon (ex: english/cards/OP01-001.json) et compléter
 *       en ne gardant QUE les champs qu'on va lire pour seeder la DB.
 *       Ne pas tout mapper "au cas où" — on ajoutera plus tard si besoin.
 */
export interface PunkCard {
  id: string;            // ex: "OP01-001"
  pack_id: string;
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "SuperRare" | "SecretRare" | "Leader" | "Special" | "TreasureRare" | "Promo";
  category: "Leader" | "Character" | "Event" | "Stage" | "Don";
  img_full_url: string;
  colors: string[];
  cost: number | null;
  attributes: string[]; // Certaines cartes ont plusieurs attributs
  power: number | null;
  counter: number | null; // Pas toutes les cartes ont des counters$
  types: string[]; // Tous les types de la carte
  effect: string | null;
  trigger: string | null;

}

/**
 * Liste des langues qu'on ingère.
 * On commence en EN+FR (MVP). À étendre quand on voudra JP/CN/TH.
 */
export type SupportedLang = 'en' | 'fr';

/** Mapping ISO 639-1 (notre PK Language.code) → nom du dossier dans punk-records. */
export const LANG_TO_FOLDER: Record<SupportedLang, string> = {
  en: 'english',
  fr: 'french',
};
