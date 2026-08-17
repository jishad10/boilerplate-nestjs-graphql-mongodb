import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Shared GraphQL ObjectTypes
 * ─────────────────────────────────────────────────────────
 * Defined ONCE here and imported wherever needed.
 * Duplicate @ObjectType() names across modules cause a
 * "Schema must contain uniquely named types" crash at startup.
 */

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;
}
