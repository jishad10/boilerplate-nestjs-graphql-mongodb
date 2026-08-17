import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgetPasswordInput,
  VerifyCodeInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './dto/auth.input';
import {
  AuthResponse,
  TokenResponse,
  MessageResponse,
} from './dto/auth.types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * AuthResolver
 * ─────────────────────────────────────────────────────────
 * Replaces AuthController.  All operations are Mutations
 * because they either write data or involve sensitive
 * side-effects (token issue, OTP send, password change).
 *
 * Public routes use @Public() — the JwtAuthGuard reads the
 * IS_PUBLIC_KEY metadata and skips token verification.
 */

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse, { description: 'Register a new user account' })
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    const result = await this.authService.register(input);
    return {
      message: result.message,
      user: result.data as any,
    };
  }

  @Public()
  @Mutation(() => AuthResponse, { description: 'Login and receive tokens' })
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    const result = await this.authService.login(input);
    return {
      message: result.message,
      accessToken: result.data.accessToken,
      user: result.data.user as any,
    };
  }

  @Public()
  @Mutation(() => TokenResponse, { description: 'Exchange refresh token for new access token' })
  async refreshAccessToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<TokenResponse> {
    const result = await this.authService.refreshAccessToken(input);
    return {
      message: result.message,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    };
  }

  @Public()
  @Mutation(() => MessageResponse, { description: 'Send OTP to email for password reset' })
  async forgetPassword(
    @Args('input') input: ForgetPasswordInput,
  ): Promise<MessageResponse> {
    const result = await this.authService.forgetPassword(input);
    return { message: result.message };
  }

  @Public()
  @Mutation(() => MessageResponse, { description: 'Verify the OTP code sent to email' })
  async verifyCode(@Args('input') input: VerifyCodeInput): Promise<MessageResponse> {
    const result = await this.authService.verifyCode(input);
    return { message: result.message };
  }

  @Public()
  @Mutation(() => MessageResponse, { description: 'Reset password after OTP verification' })
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<MessageResponse> {
    const result = await this.authService.resetPassword(input);
    return { message: result.message };
  }

  // ─── Protected Mutations (JWT Required) ──────────────────

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse, { description: 'Change password for authenticated user' })
  async changePassword(
    @CurrentUser('_id') userId: string,
    @Args('input') input: ChangePasswordInput,
  ): Promise<MessageResponse> {
    const result = await this.authService.changePassword(userId, input);
    return { message: result.message };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse, { description: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser('_id') userId: string,
  ): Promise<MessageResponse> {
    const result = await this.authService.logout(userId);
    return { message: result.message };
  }
}
