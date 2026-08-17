import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';

/**
 * GlobalExceptionFilter
 * ─────────────────────────────────────────────────────────
 * Handles errors from both HTTP and GraphQL execution contexts.
 *
 * Registered via APP_FILTER in app.module.ts so that ConfigService
 * is properly injected through NestJS DI (vs useGlobalFilters in main.ts
 * which bypasses DI and requires manual instantiation).
 *
 * Detection strategy:
 *   - Try GqlArgumentsHost.getInfo() — non-null means we are in GQL.
 *   - Fall back to HTTP response.
 */

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDev:  boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = configService.get<string>('app.env') !== 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error(
      `[${(exception as any)?.constructor?.name ?? 'Error'}] ${(exception as any)?.message}`,
      this.isDev ? (exception as any)?.stack : undefined,
    );

    const { statusCode, message, errorSources } = this.parse(exception);

    // ── GraphQL path ──────────────────────────────────────
    try {
      const gql  = GqlArgumentsHost.create(host);
      const info = gql.getInfo<any>();
      if (info) {
        throw new GraphQLError(message, {
          extensions: {
            code:         this.toCode(statusCode),
            statusCode,
            errorSources,
            ...(this.isDev && { stack: (exception as any)?.stack }),
          },
        });
      }
    } catch (e) {
      // Re-throw only if it's our GraphQLError
      if (e instanceof GraphQLError) throw e;
      // Otherwise the host isn't GQL — fall through to HTTP
    }

    // ── HTTP path ─────────────────────────────────────────
    const response = host.switchToHttp().getResponse<Response>();
    response.status(statusCode).json({
      success:      false,
      message,
      errorSources,
      ...(this.isDev && { stack: (exception as any)?.stack }),
    });
  }

  // ─── Parsers ──────────────────────────────────────────────

  private parse(exception: unknown) {
    let statusCode    = HttpStatus.INTERNAL_SERVER_ERROR;
    let message       = 'Something went wrong!';
    let errorSources: { path: string; message: string }[] = [
      { path: '', message: 'Something went wrong' },
    ];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res  = exception.getResponse() as any;
      if (typeof res === 'string') {
        message      = res;
        errorSources = [{ path: '', message }];
      } else {
        message = Array.isArray(res.message) ? 'Validation failed' : (res.message || exception.message);
        errorSources = Array.isArray(res.message)
          ? res.message.map((m: string) => ({ path: '', message: m }))
          : [{ path: '', message }];
      }
    } else if (exception instanceof MongooseError.ValidationError) {
      statusCode   = HttpStatus.BAD_REQUEST;
      message      = 'Validation failed';
      errorSources = Object.values(exception.errors).map((e: any) => ({
        path: e?.path || '', message: e?.message || '',
      }));
    } else if (exception instanceof MongooseError.CastError) {
      statusCode   = HttpStatus.BAD_REQUEST;
      message      = `Invalid ${exception.path}`;
      errorSources = [{ path: exception.path, message }];
    } else if (exception instanceof MongoServerError && (exception as any).code === 11000) {
      statusCode   = HttpStatus.CONFLICT;
      const field  = Object.keys((exception as any).keyValue || {})[0] || 'field';
      message      = `${field} already exists`;
      errorSources = [{ path: field, message }];
    } else if (exception instanceof Error) {
      message      = exception.message;
      errorSources = [{ path: '', message }];
    }

    return { statusCode, message, errorSources };
  }

  private toCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
