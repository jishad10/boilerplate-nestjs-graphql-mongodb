import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    AuthModule,
    CloudinaryModule,
  ],
  // No controllers — resolver handles everything
  providers: [UserResolver, UserService],
})

export class UserModule {}
