import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from './cards/cards.module';

@Module({
  imports: [PrismaModule, CardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
