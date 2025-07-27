import { UserService } from 'src/user/user.service';
import { Context, MiddlewareFn } from 'telegraf';

export const accessControlMiddleware = (
  userService: UserService,
): MiddlewareFn<Context> => {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    const blackListUsers = await userService.getBlacklistedUserIds();

    if (!userId || blackListUsers.includes(userId)) {
      console.log(userId, 'In black list');
      return;
    }

    await next();
  };
};
