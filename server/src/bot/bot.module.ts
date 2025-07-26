import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramGateway } from './bot.telegramgateway';
import { BotLifecycleService } from './bot-lifecycle.service';
import { ConfigService } from '@nestjs/config';
// import { AppService } from 'src/app/app.service';
import { AppModule } from 'src/app/app.module';
import { UserModule } from 'src/user/user.module';
import { GroupModule } from 'src/group/group.module';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN')!,
      }),
    }),
    forwardRef(() => AppModule),
    forwardRef(() => UserModule),
    forwardRef(() => GroupModule),
  ],
  controllers: [],
  providers: [BotService, BotLifecycleService, TelegramGateway],
  exports: [BotService],
})
export class BotModule {}
