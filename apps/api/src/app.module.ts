import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from './cards/cards.module';
import { DecksModule } from './decks/decks.module';

@Module({
  imports: [PrismaModule, CardsModule, DecksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
