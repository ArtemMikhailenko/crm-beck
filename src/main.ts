import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'
import * as connectPg from 'connect-pg-simple'

import { AppModule } from '@/app.module'
import { ms, StringValue } from '@/libs/common/utils/ms.util'
import { parseBoolean } from '@/libs/common/utils/parse-boolean.util'

// Fix BigInt serialization issue
// @ts-ignore
BigInt.prototype.toJSON = function() {
  return this.toString()
}

const PgSession = connectPg(session)

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,  // Strip properties that don't have decorators
      forbidNonWhitelisted: false,  // Don't throw errors for extra properties
    })
  )

  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.getOrThrow<string>('SESSION_DOMAIN'),
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
        sameSite: 'lax'
      },
      store: new PgSession({
        conString: config.getOrThrow<string>('DATABASE_URL'),
        tableName: 'session',
        createTableIfMissing: true,
      })
    })
  )

  // Allow multiple origins via comma-separated ALLOWED_ORIGIN
  const allowedOriginRaw = config.getOrThrow<string>('ALLOWED_ORIGIN')
  const allowedOrigins = allowedOriginRaw
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  app.enableCors({
    origin: allowedOrigins.length > 1 ? allowedOrigins : allowedOrigins[0],
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  // Setup Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Management System API')
    .setDescription('Complete user and personnel management system with RBAC, time tracking, and vacation management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('RBAC', 'Role-based access control')
    .addTag('Companies', 'Company and subcontractor management')
    .addTag('Time', 'Time tracking and timesheets')
    .addTag('Vacations', 'Vacation management')
    .addTag('Documents', 'Document management')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = config.get<number>('PORT') || config.get<number>('APPLICATION_PORT') || 8080
  await app.listen(port)
  
  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`)
}
bootstrap()
