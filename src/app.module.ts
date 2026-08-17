import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import configs from './config';
import { AppResolver } from './app.resolver';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:    true,
      load:        configs,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          ttl:   configService.get<number>('app.rateLimitWindow', 15) * 60 * 1000,
          limit: configService.get<number>('app.rateLimitMax', 100),
        },
      ],
      inject: [ConfigService],
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema:     true,
      introspection:  process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => ({
        message: error.message,
        code:    error.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV !== 'production' && {
          locations:  error.locations,
          path:       error.path,
          extensions: error.extensions,
        }),
      }),
    }),

    LoggerModule,
    DatabaseModule,
    AuthModule,
    UserModule,
  ],
  providers: [
    AppResolver,
    { provide: APP_GUARD,  useClass: GqlThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})

export class AppModule {}
