// decks.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { AddCardDto } from './dto/add-card.dto';
import { CardType } from '../../generated/prisma/enums';

@Injectable()
export class DecksService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        const [data, count] = await Promise.all([
            this.prisma.deck.findMany({ include: { leader: true } }),
            this.prisma.deck.count()]);
        return { data, count }
    }

    async findOne(id: number) {
        const res = await this.prisma.deck.findUnique({ where: { id }, include: { deckList: { include: { variant: { include: { card: true } } } }, leader: { include: { card: true } } } });

        if (!res) throw new NotFoundException(`Could not find deck number ${id}`);
        return res;
    }

    async create(dto: CreateDeckDto) {
        const { leaderId, name, description } = dto;
        const variantInDb = await this.prisma.cardVariant.findUnique({ where: { id: leaderId }, include: { card: true } })
        if (!variantInDb) throw new NotFoundException(`Cannot find specified card variant with id: ${leaderId}`);

        if (variantInDb.card.type !== CardType.Leader) throw new BadRequestException(`You must choose a leader`);

        const data = {
            name,
            leaderId,
            ...(description && { description }),
            leaderColors: variantInDb.card.colors
        }

        return this.prisma.deck.create({ data });
    }

    async update(id: number, dto: UpdateDeckDto) {
        const isDeckPresent = await this.prisma.deck.findUnique({ where: { id } })
        if (!isDeckPresent) throw new NotFoundException(`Cannot find specified deck with ${id}`);
        const { name, description } = dto;

        const data = {
            ...(name && { name }),
            ...(description && { description })
        }

        return this.prisma.deck.update({ where: { id }, data });
    }

    async remove(id: number) {
        return this.prisma.deck.delete({ where: { id } });
    }

    async addCard(id: number, dto: AddCardDto) {
        const deck = await this.prisma.deck.findUnique({ where: { id }, include: { deckList: true } });
        if (!deck) throw new NotFoundException(`Cannot find specified deck with ${id}`);

        const { cardVariantId, quantity } = dto;
        const cardVariant = await this.prisma.cardVariant.findUnique({ where: { id: cardVariantId }, include: { card: true } });
        if (!cardVariant) throw new BadRequestException(`The card with id ${cardVariantId} doesn't exist`);

        if (cardVariant.card.type === CardType.Leader) throw new BadRequestException(`Cannot add a leader to a deck`);

        if (!cardVariant.card.colors.some(color => deck.leaderColors.includes(color))) throw new BadRequestException(`Card colors are incompatible`);

        if (quantity > 4) throw new BadRequestException(`Cannot add more than 4 cards of the same code`);

        const totalCards = deck.deckList.reduce((sum, dc) => sum + dc.quantity, 0);
        if (totalCards + quantity > 50) throw new BadRequestException(`Deck size cannot exceed 50 cards`);

        const deckCard = deck.deckList.find(deckCard => deckCard.variantId === cardVariantId);
        if (deckCard) {
            if (deckCard.quantity + quantity > 4) throw new BadRequestException(`Too much card`);
            await this.prisma.deckCard.update({
                where: { id: deckCard.id },
                data: { quantity: deckCard.quantity + quantity }
            })
        } else {
            await this.prisma.deckCard.create({ data: { deckId: id, variantId: cardVariantId, quantity } })
        }
    }

    async removeCard(id: number, cardCode: string) {
        // Je trouve le deck
        const deck = await this.prisma.deck.findUnique({ where: { id }, include: { deckList: true } });
        if (!deck) throw new NotFoundException(`Cannot find specified deck with ${id}`);

        // Je récupère la Card et ses variantes à enlever 
        const card = await this.prisma.card.findUnique({ where: { code: cardCode }, include: { variants: true } });
        if (!card) throw new BadRequestException(`The card with code ${cardCode} doesn't exist`);

        // Je récupère chaque id des DeckCard à supprimer
        const deckCard = deck.deckList.filter(deckCard => card.variants.some(variant => variant.id === deckCard.variantId)).map(deckCard => deckCard.variantId);

        await this.prisma.deckCard.deleteMany({ where: { deckId: id, variantId: { in: deckCard } } });

    }
}