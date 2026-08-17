import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Model } from 'mongoose';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { USER_SELECT_FIELDS } from '../../core/constants';
import { User, UserDocument } from '../../modules/auth/schemas/user.schema';

/**
 * JwtAuthGuard (GraphQL-aware)
 * ─────────────────────────────────────────────────────────
 * Works for both REST HTTP routes (if any remain) and GraphQL
 * resolvers. The key difference is how we extract the request:
 *   - HTTP:  context.switchToHttp().getRequest()
 *   - GQL:   GqlExecutionContext.create(context).getContext().req
 *
 * @Public() still works identically — the IS_PUBLIC_KEY
 * metadata check runs before any token logic.
 */

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = this.getRequest(context);
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('auth.accessTokenSecret'),
      });

      const user = await this.userModel
        .findById(decoded._id)
        .select(USER_SELECT_FIELDS);
      if (!user) throw new UnauthorizedException('User not found');

      request.user = user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract the underlying Express request from either an HTTP
   * or a GraphQL execution context.
   */
  private getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    // GraphQL context — req is injected in app.module.ts via
    // GraphQLModule.forRoot({ context: ({ req }) => ({ req }) })
    const gqlCtx = GqlExecutionContext.create(context);
    return gqlCtx.getContext().req;
  }

  private extractToken(request: any): string | null {
    const auth = request?.headers?.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? (token ?? null) : null;
  }
}
