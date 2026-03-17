import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  databaseConfig,
  jwtConfig,
  blockchainConfig,
  redisConfig,
  mailerConfig,
} from './config/index';
import { PrismaModule } from './modules/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { CarsModule } from './modules/cars/cars.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { EarningsModule } from './modules/earnings/earnings.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MailerModule } from './modules/mailer/mailer.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        blockchainConfig,
        redisConfig,
        mailerConfig,
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Serve uploaded files (avatars, etc.)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        fallthrough: true,
      },
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BlockchainModule,
    CarsModule,
    MarketplaceModule,
    PortfolioModule,
    DriversModule,
    EarningsModule,
    AdminModule,
    NotificationsModule,
    LeaderboardModule,
    UploadsModule,
    MailerModule,
  ],
  providers: [
    // Enable rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
