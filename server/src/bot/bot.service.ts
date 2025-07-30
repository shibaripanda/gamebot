import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Group } from 'src/group/group.model';
import { GroupService } from 'src/group/group.service';
import { User } from 'src/user/user.model';
import { UserService } from 'src/user/user.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private groupService: GroupService,
    private userService: UserService,
  ) {}

  async getListUsersOfGroup(groupName: string) {
    const group: Group | null = await this.groupService.getGroup(groupName);
    const resList: { index: number; gameName: string }[] = [];
    if (group) {
      for (const user of group.users) {
        if (user) {
          const currentUser: User | null = await this.userService.getUser(user);
          if (currentUser) {
            resList.push({
              index: group.users.indexOf(user) + 1,
              gameName: currentUser.gameName,
            });
          }
        } else {
          resList.push({
            index: group.users.indexOf(user) + 1,
            gameName: '--',
          });
        }
      }
    }
    return resList;
  }

  async getGroupsButtonsList(userId: number) {
    const allGroups = await this.groupService.getGroups();
    await this.bot.telegram.sendMessage(userId, 'Выбирай!', {
      reply_markup: {
        inline_keyboard: allGroups.map((gr) => [
          { text: gr.name, callback_data: gr._id },
        ]),
      },
    });
  }

  async startMessage(userId: number) {
    await this.bot.telegram.sendMessage(
      userId,
      'Всем привет, это Крюгер-бот!😎 Здесь вы можете записаться на закупку акций альянса!🤝',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Записаться на акцию альянса',
                callback_data: 'takePlace',
              },
            ],
            [{ text: 'Инструкция по закупке', callback_data: 'faq' }],
            [
              {
                text: 'Подарки от Крюгера',
                callback_data: 'stopReciveMessages',
              },
            ],
            [
              {
                text: 'дополнительные услуги',
                callback_data: 'stopReciveMessages',
              },
            ],
          ],
        },
      },
    );
  }

  async sendTextMessage(userId: number, text: string) {
    await this.bot.telegram.sendMessage(userId, text);
  }

  async sendOneTimeInvite(userId: number) {
    const chatId = this.config.get<string>('ID_CHANNEL')!;
    const time = Number(this.config.get<string>('TIME_LIFE_LINK')!);
    const expireDate = (Math.floor(Date.now() / 1000) + 3600) * time;
    const inviteLink = await this.bot.telegram.createChatInviteLink(chatId, {
      member_limit: 1,
      expire_date: expireDate,
      name: `Invite for user ${userId}`,
    });
    await this.bot.telegram.sendMessage(
      userId,
      `Ваша персональная ссылка для вступления в канал (действует следующее количество часов: ${time}):\n${inviteLink.invite_link}`,
    );
  }

  async alertUserHaveAccess(userId: string) {
    await this.bot.telegram.sendMessage(
      Number(userId),
      'Выполнен вход в панель администратора',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Закрыть доступ', callback_data: 'closeAccess' }],
          ],
        },
      },
    );
  }
}
