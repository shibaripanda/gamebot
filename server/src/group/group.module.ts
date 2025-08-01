import { forwardRef, Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupSchema } from './group.model';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Group', schema: GroupSchema }]),
    forwardRef(() => UserModule),
  ],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
