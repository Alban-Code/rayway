import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CardsModule } from './cards/cards.module.js';
import { UsersModule } from './users/users.module.js';
import { ServeStaticModule } from "@nestjs/serve-static"
import { resolve } from 'node:path';

@Module({
  imports: [AuthModule, PrismaModule, CardsModule, UsersModule, ServeStaticModule.forRoot({
    rootPath: resolve(process.env.IMAGE_STORAGE_PATH!),
    serveRoot: '/images',
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }