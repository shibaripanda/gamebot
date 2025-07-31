import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramGateway } from './bot.telegramgateway';
import { BotLifecycleService } from './bot-lifecycle.service';
import { ConfigService } from '@nestjs/config';
import { AppModule } from 'src/app/app.module';
import { UserModule } from 'src/user/user.module';
import { GroupModule } from 'src/group/group.module';
import { accessControlMiddleware } from './botGuardAndMiddleware/access-control.middleware';
import { UserService } from 'src/user/user.service';
import { AdminGuardAccess } from './botGuardAndMiddleware/access-control.guard';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [UserModule],
      inject: [ConfigService, UserService],
      useFactory: (config: ConfigService, userService: UserService) => ({
        token: config.get<string>('BOT_TOKEN')!,
        middlewares: [accessControlMiddleware(userService)],
        dropPendingUpdates: true,
      }),
    }),
    forwardRef(() => AppModule),
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  controllers: [],
  providers: [
    BotService,
    BotLifecycleService,
    TelegramGateway,
    AdminGuardAccess,
  ],
  exports: [BotService],
})
export class BotModule {}
