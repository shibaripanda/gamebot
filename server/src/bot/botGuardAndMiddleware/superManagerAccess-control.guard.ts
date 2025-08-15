import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Context as TelegrafContext } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperManagerAccess implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getArgByIndex<TelegrafContext>(0);
    const userId = ctx?.from?.id;

    if (!userId) return false;

    const isAllowed = Number(this.config.get<number>('MANAGER')!) === userId;
    return isAllowed;
  }
}
