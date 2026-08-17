import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import { GetUsersArgs, UpdateUserInput, AdminUpdateUserInput } from './dto/user.input';
import { UserListResponse, UserResponse, MessageResponse } from './dto/user.types';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = 'uploads/tmp';

/**
 * UserResolver
 * ─────────────────────────────────────────────────────────
 * Handles transport concerns (stream → disk) then delegates
 * to UserService using plain file paths.  The service has
 * no knowledge of GraphQL or HTTP — fully decoupled.
 */

@Resolver()
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // ─── Upload Helper ─────────────────────────────────────────

  private async saveStream(upload: Promise<FileUpload>): Promise<string> {
    const { createReadStream, filename } = await upload;
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filename)}`;
    const filePath   = path.join(UPLOAD_DIR, uniqueName);

    await new Promise<void>((resolve, reject) => {
      createReadStream()
        .pipe(fs.createWriteStream(filePath))
        .on('finish', resolve)
        .on('error', reject);
    });

    return filePath;
  }

  // ─── Admin Queries ─────────────────────────────────────────

  @Query(() => UserListResponse, { description: 'Admin: list all users with pagination' })
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  async getAllUsers(@Args() args: GetUsersArgs): Promise<UserListResponse> {
    const result = await this.userService.getAllUsers(args as any);
    return { message: result.message, meta: result.meta, users: result.data.users as any, paginationInfo: result.data.paginationInfo };
  }

  @Query(() => UserListResponse, { description: 'Admin: list all admins with pagination' })
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  async getAllAdmins(@Args() args: GetUsersArgs): Promise<UserListResponse> {
    const result = await this.userService.getAllAdmins(args as any);
    return { message: result.message, meta: result.meta, users: result.data.admins as any, paginationInfo: result.data.paginationInfo };
  }

  @Query(() => UserResponse, { description: 'Admin: get any user by ID' })
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  async adminGetUser(@Args('id', { type: () => ID }) id: string): Promise<UserResponse> {
    const result = await this.userService.adminGetUserById(id);
    return { message: result.message, data: result.data as any };
  }

  // ─── Own Profile ───────────────────────────────────────────

  @Query(() => UserResponse, { description: 'Get authenticated user profile' })
  async me(@CurrentUser('_id') userId: string): Promise<UserResponse> {
    const result = await this.userService.getUserById(userId);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Update authenticated user profile' })
  async updateProfile(
    @CurrentUser('_id') userId: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<UserResponse> {
    const result = await this.userService.updateUser(userId, input as any);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => MessageResponse, { description: 'Delete authenticated user account' })
  async deleteAccount(@CurrentUser('_id') userId: string): Promise<MessageResponse> {
    const result = await this.userService.deleteUser(userId);
    return { message: result.message };
  }

  // ─── Admin Mutations ───────────────────────────────────────

  @Mutation(() => UserResponse, { description: 'Admin: update any user by ID' })
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  async adminUpdateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: AdminUpdateUserInput,
  ): Promise<UserResponse> {
    const result = await this.userService.adminUpdateUser(id, input as any);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => MessageResponse, { description: 'Admin: delete any user by ID' })
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  async adminDeleteUser(@Args('id', { type: () => ID }) id: string): Promise<MessageResponse> {
    const result = await this.userService.adminDeleteUser(id);
    return { message: result.message };
  }

  // ─── Single Avatar ─────────────────────────────────────────

  @Mutation(() => UserResponse, { description: 'Upload profile avatar' })
  async uploadAvatar(
    @CurrentUser('_id') userId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload>,
  ): Promise<UserResponse> {
    const p = await this.saveStream(file);
    const result = await this.userService.createAvatar(userId, [p]);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Replace profile avatar' })
  async updateAvatar(
    @CurrentUser('_id') userId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload>,
  ): Promise<UserResponse> {
    const p = await this.saveStream(file);
    const result = await this.userService.updateAvatar(userId, [p]);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Delete profile avatar' })
  async deleteAvatar(@CurrentUser('_id') userId: string): Promise<UserResponse> {
    const result = await this.userService.deleteAvatar(userId);
    return { message: result.message, data: result.data as any };
  }

  // ─── Multiple Avatars ─────────────────────────────────────

  @Mutation(() => UserResponse, { description: 'Upload multiple profile avatars (max 5)' })
  async uploadMultipleAvatars(
    @CurrentUser('_id') userId: string,
    @Args('files', { type: () => [GraphQLUpload] }) files: Promise<FileUpload>[],
  ): Promise<UserResponse> {
    if (!files?.length) throw new BadRequestException('At least one avatar image is required');
    const paths = await Promise.all(files.map((f) => this.saveStream(f)));
    const result = await this.userService.createMultipleAvatars(userId, paths);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Replace all profile avatars (max 5)' })
  async updateMultipleAvatars(
    @CurrentUser('_id') userId: string,
    @Args('files', { type: () => [GraphQLUpload] }) files: Promise<FileUpload>[],
  ): Promise<UserResponse> {
    if (!files?.length) throw new BadRequestException('At least one avatar image is required');
    const paths = await Promise.all(files.map((f) => this.saveStream(f)));
    const result = await this.userService.updateMultipleAvatars(userId, paths);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Delete all profile avatars' })
  async deleteMultipleAvatars(@CurrentUser('_id') userId: string): Promise<UserResponse> {
    const result = await this.userService.deleteMultipleAvatars(userId);
    return { message: result.message, data: result.data as any };
  }

  // ─── PDF ──────────────────────────────────────────────────

  @Mutation(() => UserResponse, { description: 'Upload user PDF document' })
  async uploadPDF(
    @CurrentUser('_id') userId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload>,
  ): Promise<UserResponse> {
    const p = await this.saveStream(file);
    const result = await this.userService.createPDF(userId, [p]);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Replace user PDF document' })
  async updatePDF(
    @CurrentUser('_id') userId: string,
    @Args('file', { type: () => GraphQLUpload }) file: Promise<FileUpload>,
  ): Promise<UserResponse> {
    const p = await this.saveStream(file);
    const result = await this.userService.updatePDF(userId, [p]);
    return { message: result.message, data: result.data as any };
  }

  @Mutation(() => UserResponse, { description: 'Delete user PDF document' })
  async deletePDF(@CurrentUser('_id') userId: string): Promise<UserResponse> {
    const result = await this.userService.deletePDF(userId);
    return { message: result.message, data: result.data as any };
  }
}
