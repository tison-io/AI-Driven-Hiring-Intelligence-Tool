import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { json } from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Raw body handling for Stripe webhooks
  app.use('/stripe/webhook', json({ verify: (req: any, res, buf) => { req.rawBody = buf; } }));

  // Cookie parser middleware
  app.use(cookieParser());

  // Session middleware (in-memory for development)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  // CORS with cookie support
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Hiring Intelligence API')
    .setDescription('AI-Driven Hiring Intelligence Tool API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${process.env.BACKEND_URL || `http://localhost:${port}`}`);
  console.log(`Swagger docs available at: ${process.env.SWAGGER_ENDPOINT || `http://localhost:${port}/api/docs`}`);
}

bootstrap();