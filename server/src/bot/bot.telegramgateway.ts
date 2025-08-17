import {
  CallbackQuery,
  Message,
  Update as UpdateTelegraf,
} from '@telegraf/types';
import { BotService } from './bot.service';
import { Action, Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';
import { Context, NarrowedContext } from 'telegraf';
import { UseGuards } from '@nestjs/common';
import { AdminGuardAccess } from './botGuardAndMiddleware/access-control.guard';
import { AppGateway } from 'src/app/app.gateway';
import { LastMessageMatchGuard } from './botGuardAndMiddleware/lastMessageMatchGuard.guard';
import { GroupService } from 'src/group/group.service';
import { SuperManagerAccess } from './botGuardAndMiddleware/superManagerAccess-control.guard';
import { BackupService } from './backup.service';

export type UserTelegrafContext = NarrowedContext<
  Context,
  UpdateTelegraf.MessageUpdate
>;

@Update()
export class TelegramGateway {
  private appGateway: AppGateway;
  constructor(
    private botService: BotService,
    private appService: AppService,
    private userService: UserService,
    private groupService: GroupService,
    private backupService: BackupService,
  ) {}

  setAppGateway(appGateway: AppGateway) {
    this.appGateway = appGateway;
  }

  upUsers() {
    this.appGateway.upUsers();
  }

  upData() {
    this.appGateway.upData();
  }

  // @Command('id')
  // @UseGuards(AdminGuardAccess)
  // id(@Ctx() ctx: Context) {
  //   console.log(ctx.message);
  // }

  @Command('enter')
  @UseGuards(AdminGuardAccess)
  async getAuthLink(@Ctx() ctx: Context) {
    const access = await this.appService.getStatusAccess();
    if (!access) {
      console.log('Доступ закрыт');
      return;
    }
    if (ctx && ctx.from) {
      await ctx.reply(this.appService.getAuthLink(ctx.from.id)).catch((e) => {
        console.log(e);
      });
    }
  }

  @Command('close')
  @UseGuards(SuperManagerAccess)
  async closeAccessCommand(@Ctx() ctx: Context) {
    if (ctx.from) {
      this.appGateway.closeAccess();
      await this.appService.webAccessClose();
      await this.botService.sendTextMessage(ctx.from.id, 'Веб доступ закрыт');
    }
  }

  @Command('db')
  @UseGuards(SuperManagerAccess)
  async dbBuckup(@Ctx() ctx: Context) {
    if (ctx.from) {
      await this.botService.sendTextMessage(ctx.from.id, 'Создаем бэкап...');
      await this.backupService.dailyBackup();
    }
  }

  @Command('open')
  @UseGuards(SuperManagerAccess)
  async openAccess(@Ctx() ctx: Context) {
    if (ctx.from) {
      await this.appService.webAccessOpen();
      await this.botService.sendTextMessage(ctx.from.id, 'Веб доступ открыт');
    }
  }

  @Action('closeAccess')
  @UseGuards(SuperManagerAccess)
  async closeAccess(@Ctx() ctx: Context) {
    console.log('Access close');
    if (ctx.from) {
      this.appGateway.closeAccess();
      await this.appService.webAccessClose();
      await this.botService.sendTextMessage(ctx.from.id, 'Веб доступ закрыт');
    }
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('reg_gameName')
  async secondStepInSide(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action secondStepInSide');
    await this.userService.addRegData(
      ctx.from.id,
      'next_step_data',
      'reg_gameName',
    );
    await this.botService.askGameName(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action(/^buyByMe:(.+)$/)
  async buyByMe(@Ctx() ctx: Context) {
    console.log('@Action buyByMe');
    if (ctx.from) {
      const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
      const match = callbackQuery.data.match(/^buyByMe:(.+)$/);
      if (!match) {
        await ctx.answerCbQuery('Некорректная кнопка', { show_alert: true });
        return;
      }
      await this.botService.buyByMe(ctx.from.id, match[1]);
      await ctx.answerCbQuery();
    }
  }

  @UseGuards(LastMessageMatchGuard)
  @Action(/^buyByMeStartReg:(.+)$/)
  async buyByMeStartReg(@Ctx() ctx: Context) {
    if (ctx.from) {
      const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
      const match = callbackQuery.data.match(/^buyByMeStartReg:(.+)$/);
      if (!match) {
        await ctx.answerCbQuery('Некорректная кнопка', { show_alert: true });
        return;
      }
      await this.botService.startRegistrationByMe(ctx.from.id, match[1]);
      await ctx.answerCbQuery();
    }
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('takePlacePresent')
  async takePlacePresent(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action takePlacePresent');
    await this.userService.cleaeRegData(ctx.from.id);
    await this.botService.getGroupsButtonsListPresent(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('takePlace')
  async takePlace(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action takePlace');
    await this.userService.cleaeRegData(ctx.from.id);
    await this.botService.getGroupsButtonsList(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action(/^reservPlaceInPresentGroup:(.+)$/)
  async takePlaceInPresentGroup(@Ctx() ctx: Context) {
    console.log('@Action reservPlaceInGroup');
    if (ctx.from) {
      const callbackQuery = ctx.callbackQuery as CallbackQuery.DataQuery;
      const match = callbackQuery.data.match(
        /^reservPlaceInPresentGroup:(.+)$/,
      );
      if (!match) {
        await ctx.answerCbQuery('Некорректная кнопка', { show_alert: true });
        return;
      }
      await this.botService.startRegistrationPresent(ctx.from?.id, match[1]);
      await ctx.answerCbQuery();
    }
  }

  @UseGuards(LastMessageMatchGuard)
  @Action(/^reservPlaceInGroup:(.+)$/)
  async takePlaceInGroup(@Ctx() ctx: Context) {
    console.log('@Action reservPlaceInGroup');
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

  @UseGuards(LastMessageMatchGuard)
  @Action('extraService')
  async extraService(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action extraService');
    await this.botService.extraService(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('faqPresent')
  async faqPresent(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action faqPresent');
    await this.botService.faqPresent(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('faq')
  async faq(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action faq');
    await this.botService.faq(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('mainMenu')
  async mainMenu(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action mainMenu');
    await this.botService.startMessage(ctx.from.id);
    await ctx.answerCbQuery();
  }

  @UseGuards(LastMessageMatchGuard)
  @Action('succssesRegistrtion')
  async succssesRegistrtion(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Action succssesRegistrtion');
    await this.botService.confirmUserInGroup(ctx.from.id);
    await ctx.answerCbQuery();
    this.upData();
  }

  @Start()
  async start(@Ctx() ctx: UserTelegrafContext) {
    console.log('@Start');
    await this.userService.createUserOrUpdateUser(ctx.from);
    await this.botService.startMessage(ctx.from.id);
    this.upUsers();
  }

  @On('photo')
  async addRegDataNoKruger(@Ctx() ctx: UserTelegrafContext) {
    const user = await this.userService.getUser(ctx.from.id);
    const message = ctx.message as Message.PhotoMessage;
    if ('photo' in message && this.userService.admins.includes(ctx.from.id)) {
      const photos = message.photo;
      const highestQualityPhoto = photos[photos.length - 1];
      const fileId = highestQualityPhoto.file_id;
      if (message.caption) {
        if (message.caption === 'fish') {
          await this.appService.updateFishImage(fileId);
          await ctx.reply('Готово').catch((e) => {
            console.log(e);
          });
          return;
        }
        const groups = await this.groupService.getGroups();
        if (groups) {
          const res = groups.find((gr) => gr.name === message.caption);
          if (res) {
            await this.groupService.updateGroupImage(res._id, fileId);
            await ctx.reply('Готово').catch((e) => {
              console.log(e);
            });
            return;
          }
        }
      }
    }
    if ('photo' in message && user && user.next_step_data && user.reg_groupId) {
      const photos = message.photo;
      const highestQualityPhoto = photos[photos.length - 1];
      const fileId = highestQualityPhoto.file_id;

      if (user.next_step_data === 'reg_screenNoPromo') {
        await this.userService.addRegData(
          ctx.from.id,
          user.next_step_data,
          fileId,
        );
        await this.userService.addRegData(
          ctx.from.id,
          'next_step_data',
          'reg_gameName',
        );
        console.log('ask');
        await this.botService.askGameName(ctx.from.id);
      }
      return;
    }
    if ('photo' in message && user) {
      const photos = message.photo;
      const highestQualityPhoto = photos[photos.length - 1];
      const fileId = highestQualityPhoto.file_id;
      console.log('pay');
      await this.botService.sendFileByFileIdPaymentProof(user, fileId);
      await this.botService.startMessage(ctx.from.id);
    }
  }

  @On('document')
  async addRegDataWithFile(@Ctx() ctx: UserTelegrafContext) {
    const user = await this.userService.getUser(ctx.from.id);
    const message = ctx.message as Message.DocumentMessage;

    if (
      'document' in message &&
      user &&
      user.next_step_data &&
      user.reg_groupId
    ) {
      const document = message.document;
      const fileId = document.file_id;

      // Допустим, ты ожидаешь PDF на шаге reg_docUpload
      if (user.next_step_data === 'reg_screenNoPromo') {
        await this.userService.addRegData(
          ctx.from.id,
          user.next_step_data,
          fileId,
        );

        // Обновляем шаг
        await this.userService.addRegData(
          ctx.from.id,
          'next_step_data',
          'reg_gameName',
        );

        // Задаём следующий вопрос
        await this.botService.askGameName(ctx.from.id);
      }
      return;
    }
    if ('document' in message && user) {
      const document = message.document;
      const fileId = document.file_id;
      await this.botService.sendFileByFileIdPaymentProof(user, fileId);
      await this.botService.startMessage(ctx.from.id);
    }
  }

  @On('text')
  async addRegData(@Ctx() ctx: UserTelegrafContext) {
    const user = await this.userService.getUser(ctx.from.id);
    const message = ctx.message as Message.TextMessage;
    if (user && user.next_step_data && user.reg_groupId) {
      if (user.next_step_data === 'reg_gameNamePresent') {
        await this.userService.addRegData(
          ctx.from.id,
          'reg_gameName',
          message.text.slice(0, 100),
        );
        await this.botService.confirmationPresent(ctx.from.id);
        this.upData();
        return;
      }
      if (user.next_step_data === 'reg_email') {
        const email = message.text;

        const isValidEmail =
          typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValidEmail) {
          await ctx
            .reply('⚠️ Попробуй еще раз, некоретный email')
            .catch((e) => {
              console.log(e);
            });
          return false;
        }

        const isExist = await this.groupService.getGroupEmail(
          user.reg_groupId,
          email,
        );
        if (!isExist) {
          await ctx.reply('⚠️ Уже зарегестрирован!').catch((e) => {
            console.log(e);
          });
          return false;
        }
      }
      await this.userService.addRegData(
        ctx.from.id,
        user.next_step_data,
        message.text.slice(0, 100),
      );
      if (user.next_step_data === 'reg_gameName') {
        await this.userService.addRegData(
          ctx.from.id,
          'next_step_data',
          'reg_email',
        );
        if (user.reg_screenNoPromo) {
          await this.botService.confirmationNoKruger(ctx.from.id);
        } else {
          await this.botService.askEmail(ctx.from.id);
        }
      } else if (user.next_step_data === 'reg_email') {
        await this.userService.addRegData(
          ctx.from.id,
          'next_step_data',
          'reg_password',
        );
        await this.botService.askPassword(ctx.from.id);
      } else if (user.next_step_data === 'reg_password') {
        await this.botService.confirmation(ctx.from.id);
      }
    }
    this.upData();
  }
}
