import "dotenv/config"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ExpressAdapter } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api')
  const documentBuilder = new DocumentBuilder();
  const swaggerConfig = documentBuilder.setTitle("").setDescription("").setVersion("").addTag("").build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
