import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CardsModule } from './cards/cards.module.js';
import { UsersModule } from './users/users.module.js';
import { TypesModule } from "./types/types.module.js";
import { ServeStaticModule } from "@nestjs/serve-static"
import { resolve } from 'node:path';
import { DecksModule } from './decks/decks.module.js';

@Module({
  imports: [AuthModule, PrismaModule, CardsModule, UsersModule, DecksModule, TypesModule, ServeStaticModule.forRoot({
    rootPath: resolve(process.env.IMAGE_STORAGE_PATH!),
    serveRoot: '/images',
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }