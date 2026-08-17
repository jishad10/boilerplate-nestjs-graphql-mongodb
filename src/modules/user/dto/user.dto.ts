/**
 * Backward-compat re-export so user.service.ts compiles unchanged.
 */

export {
  UpdateUserInput      as UpdateUserDto,
  AdminUpdateUserInput as AdminUpdateUserDto,
  GetUsersArgs         as GetUsersQueryDto,
} from './user.input';
