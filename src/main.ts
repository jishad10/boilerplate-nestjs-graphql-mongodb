import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app-logger.service';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody:    true,
  });

  const configService = app.get(ConfigService);
  const logger        = app.get(AppLogger);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  app.enableCors({
    origin: [
      configService.get<string>('app.frontendUrl'),
      configService.get<string>('app.adminUrl'),
    ],
    credentials: true,
  });

  // Multipart support for GraphQL file uploads (graphql-upload-ts spec)
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:       true,
      forbidNonWhitelisted: false,
      transform:       true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // GlobalExceptionFilter is registered via APP_FILTER in app.module.ts
  // so it benefits from full NestJS DI (ConfigService, etc.)

  const port = configService.get<number>('app.port', 5000);
  await app.listen(port);
  logger.log(`🚀  Server running → http://localhost:${port}/graphql`);
}

bootstrap();
