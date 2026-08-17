import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * GqlThrottlerGuard
 * ─────────────────────────────────────────────────────────
 * The default ThrottlerGuard reads req.ip from the HTTP context.
 * In GraphQL, the request is nested inside the GQL context object.
 * This override extracts the correct request so throttling works
 * identically for both REST and GraphQL.
 */

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      return { req: http.getRequest(), res: http.getResponse() };
    }

    const gql = GqlExecutionContext.create(context);
    const ctx = gql.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
