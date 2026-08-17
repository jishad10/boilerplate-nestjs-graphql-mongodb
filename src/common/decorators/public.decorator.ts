import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public()
 * ─────────────────────────────────────────────────────────
 * Mark a resolver method (or whole resolver class) as public
 * so JwtAuthGuard skips token verification for that operation.
 *
 * Usage:
 *   @Public()
 *   @Mutation(() => AuthResponse)
 *   async login(...) { ... }
 */

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
