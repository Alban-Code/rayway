import { DEFAULT_LANG } from "../constants.js";

export function pickByLang<T extends { languageCode: string }>(items: T[], lang: string): T | null {
    return (items.find((i) => i.languageCode === lang) ?? items.find((i) => i.languageCode === DEFAULT_LANG) ?? null);
}