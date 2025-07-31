import {
  CallbackQuery,
  // Message,
  Update as UpdateTelegraf,
} from '@telegraf/types';
import { BotService } from './bot.service';
import {
  Action,
  Command,
  Ctx,
  // Hears,
  // On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';
import { Context, NarrowedContext } from 'telegraf';
import { UseGuards } from '@nestjs/common';
import { AdminGuardAccess } from './botGuardAndMiddleware/access-control.guard';
// import { GroupService } from 'src/group/group.service';

export type UserTelegrafContext = NarrowedContext<
  Context,
  UpdateTelegraf.MessageUpdate
>;

@Update()
export class TelegramGateway {
  constructor(
    private botService: BotService,
    private appService: AppService,
    private userService: UserService,
    // private groupService: GroupService,
  ) {}

  // @Hears(/^deletegroup(?:\s+(.*))?$/i)
  // @UseGuards(AdminGuardAccess)
  // async deletegroup(@Ctx() ctx: UserTelegrafContext) {
  //   console.log('@Hears deletegroup', ctx.from.id);
  //   const message = ctx.message as Message.TextMessage;

  //   const match = message.text.match(/^deletegroup(?:\s+(.*))?$/i);
  //   const rawName = match?.[1]?.trim();

  //   const groupName =
  //     rawName && rawName.length > 0 ? rawName : `New Group ${Date.now()}`;

  //   await this.groupService.deleteGroup(groupName);
  //   await ctx.reply(`✅ Группа "${groupName}" успешно удалена.`);
  // }

  // @Hears(/^addgroup(?:\s+(.*))?$/i)
  // @UseGuards(AdminGuardAccess)
  // async addgroup(@Ctx() ctx: UserTelegrafContext) {
  //   console.log('@Hears addgroup', ctx.from.id);
  //   const message = ctx.message as Message.TextMessage;

  //   const match = message.text.match(/^addgroup(?:\s+(.*))?$/i);
  //   const rawName = match?.[1]?.trim();

  //   const groupName =
  //     rawName && rawName.length > 0 ? rawName : `New Group ${Date.now()}`;

  //   await this.groupService.createGroup(groupName);
  //   await ctx.reply(`✅ Группа "${groupName}" успешно создана.`);
  // }

  @Action('takePlace')
  async takePlace(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action takePlace');
    await this.botService.getGroupsButtonsList(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @Action(/^reservPlaceInGroup:(.+)$/)
  async takePlaceInGroup(@Ctx() ctx: Context) {
    console.log('@Action takePlace');
    if (ctx.from) {
      const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
      const match = callbackQuery.data.match(/^reservPlaceInGroup:(.+)$/);
      if (!match) {
        await ctx.answerCbQuery('Некорректная кнопка', { show_alert: true });
        return;
      }
      await this.botService.startRegistration(ctx.from?.id, match[1]);
      await ctx.answerCbQuery();
    }
  }

  @Action('extraService')
  async extraService(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action extraService');
    await this.botService.extraService(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @Action('faq')
  async faq(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action faq');
    await this.botService.faq(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @Action('mainMenu')
  async mainMenu(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action mainMenu');
    await this.botService.startMessage(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @Start()
  async start(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Start');
    await this.userService.createUserOrUpdateUser(ctx.from);
    await this.botService.startMessage(ctx.from.id);
  }

  // @On('chat_member')
  // async onChatMemberUpdate(
  //   @Ctx() ctx: NarrowedContext<Context, UpdateTelegraf.ChatMemberUpdate>,
  // ) {
  //   const update = ctx.update.chat_member;
  //   const user = update.new_chat_member.user;
  //   const chatId = update.chat.id;

  //   if (!user || !chatId || update.new_chat_member.status !== 'member') return;

  //   const telegramId = user.id;

  //   // Проверка оплаты через сервис доступа
  //   const hasAccess = true; //await this.accessService.hasAccess(telegramId) || true;

  //   if (!hasAccess) {
  //     // Удаляем пользователя, если нет доступа
  //     await ctx.telegram.banChatMember(chatId, telegramId);
  //     await ctx.telegram.unbanChatMember(chatId, telegramId);
  //     await ctx.telegram.sendMessage(
  //       telegramId,
  //       '❌ У вас нет доступа. Оплатите подписку, чтобы вступить в канал.',
  //     );
  //   } else {
  //     // Можно отправить приветствие, если хочешь
  //     await ctx.telegram.sendMessage(
  //       telegramId,
  //       '👋 Добро пожаловать в канал!',
  //     );
  //   }
  // }

  // @Hears('hi')
  // async hears(@Ctx() ctx: Context) {
  //   await ctx.reply('get hi');
  // }

  // @On('photo')
  // async addNewOrderImages(@Ctx() ctx: Context) {
  //   await ctx.reply('get photo');
  // }

  @Action('closeAccess')
  @UseGuards(AdminGuardAccess)
  async closeAccess(@Ctx() ctx: Context) {
    console.log('Access close');
    if (ctx.from) {
      await this.botService.sendTextMessage(ctx.from.id, 'Доступ закрыт');
    }
  }

  @Command('enter')
  @UseGuards(AdminGuardAccess)
  async getAuthLink(@Ctx() ctx: Context) {
    if (ctx && ctx.from) {
      await ctx.reply(this.appService.getAuthLink(ctx.from.id));
    }
  }
}
