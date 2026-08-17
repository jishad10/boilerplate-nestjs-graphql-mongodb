import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * @CurrentUser()
 * ─────────────────────────────────────────────────────────
 * Works in both HTTP controllers (if any) and GraphQL resolvers.
 *
 * Usage in resolver:
 *   @Query()
 *   me(@CurrentUser() user: UserDocument) { ... }
 *
 *   @Mutation()
 *   update(@CurrentUser('_id') userId: string, ...) { ... }
 */

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    let user: any;

    if (ctx.getType() === 'http') {
      user = ctx.switchToHttp().getRequest().user;
    } else {
      // GraphQL — req is set by JwtAuthGuard
      user = GqlExecutionContext.create(ctx).getContext().req?.user;
    }

    return data ? user?.[data] : user;
  },
);
