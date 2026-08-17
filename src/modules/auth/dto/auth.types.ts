import { ObjectType, Field, ID } from '@nestjs/graphql';

export { MessageResponse } from '../../../common/graphql/common.types';

@ObjectType()
export class UserPayload {
  @Field(() => ID)
  _id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field({ nullable: true })
  refreshToken?: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  accessToken?: string;

  @Field(() => UserPayload, { nullable: true })
  user?: UserPayload;
}

@ObjectType()
export class TokenResponse {
  @Field()
  message: string;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
