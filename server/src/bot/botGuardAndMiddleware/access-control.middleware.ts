import { Context, MiddlewareFn } from 'telegraf';
import { ModuleRef } from '@nestjs/core';
import { AppService } from '../../app/app.service';
import { UserService } from '../../user/user.service';

export const accessControlMiddleware = (): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    if (ctx.chat?.type !== 'private') {
      console.log('stop');
      return;
    }

    // Проверяем, что сообщение не от бота
    if (ctx.from?.is_bot) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const moduleRef: ModuleRef = ctx.state.moduleRef;

    const userService = moduleRef.get(UserService, { strict: false });
    const appService = moduleRef.get(AppService, { strict: false });

    const userId = ctx.from?.id;
    const blackListUsers = await appService.getBunUsers();

    if (!userId || blackListUsers?.includes(userId)) {
      console.log(userId, 'In black list');
      return;
    }
    await userService.upActivity(userId);
    await next();
  };
};
