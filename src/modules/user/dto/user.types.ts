import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

export { MessageResponse } from '../.././../common/graphql/common.types';

@ObjectType()
export class AddressType {
  @Field({ nullable: true }) country?: string;
  @Field({ nullable: true }) cityState?: string;
  @Field({ nullable: true }) roadArea?: string;
  @Field({ nullable: true }) postalCode?: string;
  @Field({ nullable: true }) taxId?: string;
}

@ObjectType()
export class UserType {
  @Field(() => ID)
  _id: string;

  @Field() name: string;
  @Field() email: string;
  @Field() role: string;

  @Field({ nullable: true }) username?: string;
  @Field({ nullable: true }) phone?: string;
  @Field({ nullable: true }) gender?: string;
  @Field({ nullable: true }) bio?: string;
  @Field({ nullable: true }) language?: string;
  @Field({ nullable: true }) profileImage?: string;
  @Field({ nullable: true }) pdfFile?: string;
  @Field({ nullable: true }) isVerified?: boolean;
  @Field({ nullable: true }) hasActiveSubscription?: boolean;
  @Field({ nullable: true }) dob?: string;
  @Field({ nullable: true }) stripeAccountId?: string;

  @Field(() => [String], { nullable: true }) multiProfileImage?: string[];
  @Field(() => AddressType, { nullable: true }) address?: AddressType;

  @Field({ nullable: true }) createdAt?: string;
  @Field({ nullable: true }) updatedAt?: string;
}

@ObjectType()
export class PaginationInfo {
  @Field(() => Int) currentPage: number;
  @Field(() => Int) totalPages: number;
  @Field(() => Boolean) hasNextPage: boolean;
  @Field(() => Boolean) hasPrevPage: boolean;
}

@ObjectType()
export class PaginationMeta {
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) limit: number;
  @Field(() => Int) totalPages: number;
}

@ObjectType()
export class UserListResponse {
  @Field() message: string;
  @Field(() => PaginationMeta) meta: PaginationMeta;
  @Field(() => [UserType]) users: UserType[];
  @Field(() => PaginationInfo) paginationInfo: PaginationInfo;
}

@ObjectType()
export class UserResponse {
  @Field() message: string;
  @Field(() => UserType) data: UserType;
}
