import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsNumberString,
  Length,
} from 'class-validator';

/**
 * Auth Input Types (GraphQL)
 * ─────────────────────────────────────────────────────────
 * Each class is decorated with @InputType() so NestJS/GraphQL
 * can auto-generate the matching SDL input types in schema.gql.
 * class-validator decorators still work identically — the global
 * ValidationPipe validates them on every mutation.
 */

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

@InputType()
export class ForgetPasswordInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@InputType()
export class VerifyCodeInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsNumberString()
  @Length(6, 6)
  otp: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @Field()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
