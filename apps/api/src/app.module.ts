import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CardsModule } from './cards/cards.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [AuthModule, PrismaModule, CardsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }