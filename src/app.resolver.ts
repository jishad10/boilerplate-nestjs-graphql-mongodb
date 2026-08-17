import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { Public } from './common/decorators/public.decorator';

@ObjectType()
export class HealthResponse {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  uptime: number;
}

/**
 * AppResolver
 * ─────────────────────────────────────────────────────────
 * Health check accessible without authentication.
 * Returns a typed HealthResponse instead of raw JSON string.
 */

@Resolver()
export class AppResolver {
  @Public()
  @Query(() => HealthResponse, { description: 'Server health check' })
  health(): HealthResponse {
    return {
      status:    'ok',
      timestamp: new Date().toISOString(),
      uptime:    Math.floor(process.uptime()),
    };
  }
}
