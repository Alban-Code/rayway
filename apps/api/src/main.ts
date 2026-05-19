import "dotenv/config"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ExpressAdapter } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), { bodyParser: false });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({ origin: 'http://localhost:5173', credentials: true });
  const documentBuilder = new DocumentBuilder();
  const swaggerConfig = documentBuilder.setTitle("Rayway API").setDescription("One Piece TCG companion API").setVersion("0.1.0").build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
