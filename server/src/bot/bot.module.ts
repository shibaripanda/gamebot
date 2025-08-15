// import { forwardRef, Module } from '@nestjs/common';
// import { BotService } from './bot.service';
// import { TelegrafModule } from 'nestjs-telegraf';
// import { TelegramGateway } from './bot.telegramgateway';
// import { BotLifecycleService } from './bot-lifecycle.service';
// import { ConfigService } from '@nestjs/config';
// import { AppModule } from 'src/app/app.module';
// import { UserModule } from 'src/user/user.module';
// import { GroupModule } from 'src/group/group.module';
// import { accessControlMiddleware } from './botGuardAndMiddleware/access-control.middleware';
// import { UserService } from 'src/user/user.service';
// import { AdminGuardAccess } from './botGuardAndMiddleware/access-control.guard';
// import { AppService } from 'src/app/app.service';

// @Module({
//   imports: [
//     TelegrafModule.forRootAsync({
//       imports: [UserModule, AppModule],
//       inject: [ConfigService, UserService, AppService],
//       useFactory: (
//         config: ConfigService,
//         userService: UserService,
//         appService: AppService,
//       ) => ({
//         token: config.get<string>('BOT_TOKEN')!,
//         middlewares: [accessControlMiddleware(userService, appService)],
//         dropPendingUpdates: true,
//       }),
//     }),
//     forwardRef(() => AppModule),
//     forwardRef(() => UserModule),
//     forwardRef(() => GroupModule),
//   ],
//   controllers: [],
//   providers: [
//     BotService,
//     BotLifecycleService,
//     TelegramGateway,
//     AdminGuardAccess,
//   ],
//   exports: [BotService, TelegramGateway],
// })
// export class BotModule {}

import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ModuleRef } from '@nestjs/core';

import { BotService } from './bot.service';
import { BotLifecycleService } from './bot-lifecycle.service';
import { TelegramGateway } from './bot.telegramgateway';
import { AdminGuardAccess } from './botGuardAndMiddleware/access-control.guard';

// import { AppModule } from '../app/app.module';
import { UserModule } from '../user/user.module';
import { GroupModule } from '../group/group.module';

import { accessControlMiddleware } from './botGuardAndMiddleware/access-control.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [],
      inject: [ConfigService, ModuleRef],
      useFactory: (config: ConfigService, moduleRef: ModuleRef) => ({
        token: config.get<string>('BOT_TOKEN')!,
        dropPendingUpdates: true,
        middlewares: [
          (ctx, next) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ctx.state.moduleRef = moduleRef;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return accessControlMiddleware()(ctx, next);
          },
        ],
      }),
    }),
    // forwardRef(() => AppModule),
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  controllers: [],
  providers: [
    BotService,
    BotLifecycleService,
    TelegramGateway,
    AdminGuardAccess,
    BackupService,
  ],
  exports: [BotService, TelegramGateway],
})
export class BotModule {}
