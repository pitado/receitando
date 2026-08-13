import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';
import express from 'express';
import { createServer } from 'node:http';

import { WorkerAppModule } from './worker-app.module';

const PORT = 3333;
const expressApplication = express();
const adapter = new ExpressAdapter(expressApplication);
const app = await NestFactory.create(WorkerAppModule, adapter, {
  bufferLogs: true,
});

app.setGlobalPrefix('api');
app.enableCors({
  origin: env.FRONTEND_URL.split(',').map((origin) => origin.trim()),
  credentials: true,
});
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

const swaggerConfig = new DocumentBuilder()
  .setTitle('Receitando API')
  .setDescription(
    'API para descobrir receitas a partir dos ingredientes disponíveis.',
  )
  .setVersion('1.0')
  .build();
const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
SwaggerModule.setup('api/docs', app, swaggerDocument);

await app.init();

const server = createServer(expressApplication);
server.listen(PORT);

export default httpServerHandler({ port: PORT });
