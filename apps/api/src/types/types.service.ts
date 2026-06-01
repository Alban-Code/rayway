import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { TypeQueryDto } from "./dto/type-query.dto.js";
import { TypeDto } from "./dto/type-response.dto.js";

@Injectable()
export class TypesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: TypeQueryDto): Promise<TypeDto[]> {
        const { lang } = query
        const langCode = lang ?? "en"

        const types = await this.prisma.type.findMany({
            where: { translations: { some: { languageCode: langCode } } },
            include: { translations: { where: { languageCode: langCode } } }
        })

        return types.map((type) => ({ code: type.code, label: type.translations[0].label }))
    }
}