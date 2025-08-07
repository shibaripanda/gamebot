import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel('User') private userMongo: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  admins: number[] = [];

  onModuleInit() {
    const adminsStr = this.config.get<string>('ADMINS');
    this.admins = adminsStr
      ? adminsStr.split(',').map((id) => Number(id.trim()))
      : [];

    console.log(this.admins); // [599773731, 123456789]
  }

  // async recivedAlianceNameSet(userId: number) {
  //   await this.userMongo.updateOne(
  //     { id: userId },
  //     { recivedAlianceName: true },
  //   );
  // }

  async addRegData(userId: number, field: string, data: string) {
    await this.userMongo.updateOne({ id: userId }, { [field]: data });
  }

  async updateLastMessage(userId: number, messageId: number) {
    const res = await this.userMongo.findOneAndUpdate(
      { id: userId },
      { lastMessage: messageId },
    );
    if (res) {
      return res.lastMessage;
    }
  }

  async cleaeRegData(userId: number) {
    return await this.userMongo.findOneAndUpdate(
      { id: userId },
      {
        reg_gameName: '',
        reg_email: '',
        reg_password: '',
        reg_groupId: '',
        reg_screenNoPromo: '',
      },
      { returnDocument: 'after' },
    );
  }

  async getUser(userId: number) {
    const userRes: User | null = await this.userMongo.findOne({ id: userId });
    return userRes;
  }

  async getBlacklistedUserIds(): Promise<number[]> {
    const users: User[] = await this.userMongo.find(
      { blackList: true },
      { id: 1, _id: 0 },
    );

    return users.map((user) => user.id);
  }

  async markUserWhitelisted(userId: number): Promise<void> {
    const res = await this.userMongo.updateOne(
      { id: userId },
      { $set: { blackList: false } },
      { upsert: true },
    );

    console.log(`User ${userId} marked as whitelisted`, res);
  }

  async markUserBlacklisted(userId: number): Promise<void> {
    const res = await this.userMongo.updateOne(
      { id: userId },
      { $set: { blackList: true } },
      { upsert: true },
    );

    console.log(`User ${userId} marked as blacklisted`, res);
  }

  async createUserOrUpdateUser(
    user: Omit<User, 'gameName' | 'blackList' | 'lastMessage'>,
  ) {
    const userRes = await this.userMongo.updateOne({ id: user.id }, user, {
      upsert: true,
    });
    console.log(userRes);
  }
}
