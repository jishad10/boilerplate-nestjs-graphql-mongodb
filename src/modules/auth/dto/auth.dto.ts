/**
 * Backward-compat re-export so auth.service.ts compiles unchanged.
 * The service uses these as plain TypeScript types (not decorators),
 * so the InputType versions are 100% compatible.
 */

export {
  RegisterInput   as RegisterDto,
  LoginInput      as LoginDto,
  RefreshTokenInput  as RefreshTokenDto,
  ForgetPasswordInput as ForgetPasswordDto,
  VerifyCodeInput    as VerifyCodeDto,
  ResetPasswordInput  as ResetPasswordDto,
  ChangePasswordInput as ChangePasswordDto,
} from './auth.input';
