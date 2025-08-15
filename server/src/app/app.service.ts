import { Injectable, OnModuleInit } from '@nestjs/common';
import { TokenData } from './interfaces/tokenData';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenAndUserId } from './interfaces/tokenAndUserId';
import { AppDocument, PaymentMetod } from './app.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppGateway } from './app.gateway';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AppService implements OnModuleInit {
  private tokens = new Map<string, TokenData>();
  private appGateway: AppGateway;

  constructor(
    private readonly config: ConfigService,
    private jwt: JwtService,
    private userService: UserService,
    @InjectModel('App') private appMongo: Model<AppDocument>,
  ) {
    console.log('AppService initialized');
  }

  setAppGateway(appGateway: AppGateway) {
    this.appGateway = appGateway;
  }

  async getFishImage() {
    const res = await this.appMongo.findOne(
      { app: 'app' },
      { _id: 0, fishImage: 1 },
    );
    if (res) return res.fishImage;
    return '';
  }

  async updateFishImage(file_id: string) {
    await this.appMongo.updateOne({ app: 'app' }, { fishImage: file_id });
  }

  async unBunUsers(userIds: string[]) {
    const usersTelegramIds =
      await this.userService.getUsersTelegramIds(userIds);

    const res = await this.appMongo.findOneAndUpdate(
      { app: 'app' },
      { $pull: { bunUsers: { $in: usersTelegramIds } } },
      { new: true }, // $in вместо $each
    );
    if (res) return res.bunUsers;
  }

  async bunUsers(userIds: string[]) {
    const usersTelegramIds =
      await this.userService.getUsersTelegramIds(userIds);
    const res = await this.appMongo.findOneAndUpdate(
      { app: 'app' },
      { $addToSet: { bunUsers: { $each: usersTelegramIds } } },
      { new: true },
    );
    if (res) return res.bunUsers;
    return [];
  }

  async onModuleInit() {
    await this.appMongo.updateOne(
      { app: 'app' },
      { $setOnInsert: { app: 'app', paymentMetods: [] } },
      { upsert: true },
    );
  }

  async getBunUsers() {
    const res = await this.appMongo.findOne(
      { app: 'app' },
      { _id: 0, bunUsers: 1 },
    );
    if (res) return res.bunUsers;
  }

  async getStatusAccess() {
    const res = await this.appMongo.findOne(
      { app: 'app' },
      { _id: 0, webAccess: 1 },
    );
    if (res) return res.webAccess;
  }

  async webAccessOpen() {
    await this.appMongo.updateOne({ app: 'app' }, { webAccess: true });
  }

  async webAccessClose() {
    await this.appMongo.updateOne({ app: 'app' }, { webAccess: false });
  }

  async deletePaymentMetod(metod: PaymentMetod) {
    const res = await this.appMongo.findOneAndUpdate(
      { app: 'app' },
      { $pull: { paymentMetods: metod } },
      { returtDocument: 'after', new: true },
    );
    if (res) return res.paymentMetods;
    return false;
  }

  async addPaymentMetod(metod: PaymentMetod) {
    const res = await this.appMongo.findOneAndUpdate(
      { app: 'app' },
      { $addToSet: { paymentMetods: metod } },
      { returnDocument: 'after', new: true },
    );
    if (res) return res.paymentMetods;
    return false;
  }

  async getPaymentMetod(payId: string) {
    const app = await this.appMongo.findOne(
      { 'paymentMetods._id': payId },
      { paymentMetods: { $elemMatch: { _id: payId } } },
    );

    if (app && app.paymentMetods.length > 0) {
      return app.paymentMetods[0];
    }

    return null;
  }

  async getPaymentMetods() {
    const res = await this.appMongo.findOne(
      { app: 'app' },
      { _id: 0, paymentMetods: 1 },
    );
    if (res) return res.paymentMetods;
    return false;
  }

  getAuthLink(userId: number): string {
    const token = this.generateToken(String(userId));
    return `${this.config.get<string>('WEB_URL')}/#/?token=${token}`;
  }

  generateToken(userId: string): string {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (data.expiresAt <= now) {
        this.tokens.delete(token);
      }
    }

    const token: string = uuidv4();
    const expiresAt = now + 10 * 60 * 1000; // 10 минут
    this.tokens.set(token, { userId, used: false, expiresAt });
    return token;
  }

  async validateToken(token: string): Promise<TokenAndUserId | null> {
    const data: TokenData | undefined = this.tokens.get(token);
    if (!data || data.used || data.expiresAt < Date.now()) return null;

    data.used = true;
    this.tokens.set(token, data);
    this.tokens.delete(token);
    return {
      token: await this.jwt.signAsync({ userId: data.userId }),
      userId: data.userId,
    };
  }
}
