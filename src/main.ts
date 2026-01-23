import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { ConfigService } from './config/config.service';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const cfg = app.get(ConfigService);
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined')); // Use morgan for logging HTTP requests
  }
  if (cfg.getConfig().API_GATEWAY?.PROXY) {
    app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  }
  //3. Servir configuración
  app.use(express.static('public'));

  //4 .Prefijo golbal
  app.setGlobalPrefix('apigateway'); // Set global prefix for all routes
  app.disable('x-powered-by');
  // 5. Documentación Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API Gateway for Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('apigateway/docs', app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir cualquier localhost con cualquier puerto en desarrollo
      const isDevelopment = process.env.NODE_ENV === 'development';
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (!origin || (isDevelopment && localhostRegex.test(origin))) {
        callback(null, true);
      } else {
        const allowedOrigins = cfg.getConfig().API_GATEWAY?.CORS_ORIGIN?.split(',') || [];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS ' + origin));
        }
      }
    },
    exposedHeaders: ['Set-Cookie'],
    methods: cfg.getConfig().API_GATEWAY?.HTTP_METHODS_ALLOWED, // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin'], // Allow specific headers
    credentials: true, // Allow credentials
  });
  const PORT = cfg.getConfig().API_GATEWAY?.PORT ?? 3000;
  await app.listen(PORT);
  console.log(
    `🚀 API Gateway listening on http://localhost:${PORT}/apigateway`,
  );
}
main();
