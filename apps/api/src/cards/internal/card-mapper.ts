import { DEFAULT_LANG } from "../../common/constants.js";
import { pickByLang } from "../../common/lang/pick-by-lang.js";
import { CardListItemDto } from "../dto/card-response.dto.js";
import { CardWithRelations } from "./card-include.js";

export function mapCard(card: CardWithRelations, lang: string): CardListItemDto {
    const translation = pickByLang(card.translations, lang);
    const resolvedLang = translation?.languageCode ?? DEFAULT_LANG;

    return {
        code: card.code,
        name: translation?.name ?? '',
        category: card.category,
        colors: card.colors,
        cost: card.cost,
        power: card.power,
        counterAmount: card.counterAmount,
        life: card.life,
        attributes: card.attributes,
        rarity: card.rarity,
        types: card.types.map((ct) => ({
            code: ct.type.code,
            label: pickByLang(ct.type.translations, lang)?.label ?? '',
        })),
        effect: translation?.effect ?? null,
        triggerEffect: translation?.triggerEffect ?? null,
        variants: card.variants.map((v) => ({
            variantCode: v.variantCode,
            variantType: v.variantType,
            isPromo: v.isPromo,
            isStarter: v.isStarter,
            imageUrl: pickByLang(v.images, lang)?.imageUrl ?? null,
        })),
        setCode: card.set.code,
        language: resolvedLang,
    };
}