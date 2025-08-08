import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';
import { Context, MiddlewareFn } from 'telegraf';

export const accessControlMiddleware = (
  userService: UserService,
  appService: AppService,
): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    const blackListUsers = await appService.getBunUsers();

    if (!userId || blackListUsers?.includes(userId)) {
      console.log(userId, 'In black list');
      return;
    }

    console.log('ssssssss');

    await next();
  };
};
