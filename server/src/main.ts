import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const PORT = process.env.PORT ?? 5111;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.set('trust proxy', true);
  app.use(express.static(join(__dirname, '..', 'public')));
  // app.get('*', (req, res) => {
  //   res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  // });
  await app.listen(PORT, () => {
    console.log(`Server GAMEBOT started on port = ${PORT}`);
  });
  process.once('SIGINT', () => void app.close());
  process.once('SIGTERM', () => void app.close());
}
void bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app/app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { NestExpressApplication } from '@nestjs/platform-express';
// import * as express from 'express';
// import { join } from 'path';

// async function bootstrap() {
//   const PORT = process.env.PORT ?? 5111;
//   const app = await NestFactory.create<NestExpressApplication>(AppModule);

//   app.useGlobalPipes(new ValidationPipe());

//   app.enableCors({
//     origin: '*',
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   });

//   app.set('trust proxy', true);

//   app.use(express.static(join(__dirname, '..', 'public')));

//   // Получаем нативный express сервер
//   const expressApp = app.getHttpAdapter().getInstance();

//   // Теперь можно безопасно использовать express методы с типами
//   expressApp.get('*', (req: express.Request, res: express.Response) => {
//     res.sendFile(join(__dirname, '..', 'public', 'index.html'));
//   });

//   await app.listen(PORT, () => {
//     console.log(`Server GAMEBOT started on port = ${PORT}`);
//   });

//   process.once('SIGINT', () => void app.close());
//   process.once('SIGTERM', () => void app.close());
// }

// void bootstrap();
