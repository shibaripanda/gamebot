import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Context as TelegrafContext } from 'telegraf';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LastMessageMatchGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getArgByIndex<TelegrafContext>(0);
    const userId = ctx?.from?.id;

    if (!userId) return false;

    const user = await this.userService.getUser(userId);
    if (!user || !user.lastMessage) return false;

    const callbackQuery = ctx.callbackQuery;
    const messageIdFromCallback = callbackQuery?.message?.message_id;

    if (!messageIdFromCallback) return false;

    if (user.lastMessage !== messageIdFromCallback) {
      await ctx.answerCbQuery(
        'Используй последнее сообщение или перезапусти бот',
      );
    }
    await ctx.answerCbQuery();
    return user.lastMessage === messageIdFromCallback;
  }
}
