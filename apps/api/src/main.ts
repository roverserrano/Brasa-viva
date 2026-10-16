import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { RequestContext } from './common/http/request-context';
import { ApiExceptionFilter } from './common/http/api-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

  const adapter = app.getHttpAdapter();
  const server = adapter.getInstance() as {
    disable(name: string): void;
    set(name: string, value: string[]): void;
  };
  server.disable('x-powered-by');
  const trustedProxies = process.env.TRUSTED_PROXY_ADDRESSES?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (trustedProxies?.length) server.set('trust proxy', trustedProxies);
  app.use((request: RequestContext, response: ServerResponse, next: () => void) => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    if ((request.url ?? '').toLowerCase().startsWith('/api/v1/admin'))
      response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: webOrigin,
    credentials: false,
    exposedHeaders: ['X-Request-Id', 'Retry-After']
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('Brasa Viva API')
    .setDescription('API pública y administrativa de Brasa Viva.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApiConfig));
  }

  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
