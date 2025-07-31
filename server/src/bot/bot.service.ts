import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
// import { Group } from 'src/group/group.model';
// import { Group } from 'src/group/group.model';
import { GroupService } from 'src/group/group.service';
// import { User } from 'src/user/user.model';
// import { User } from 'src/user/user.model';
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

  async startRegistration(userId: number, groupId: string) {
    const group = await this.groupService.getGroup(groupId);
    console.log(group);
    if (!group) {
      await this.getGroupsButtonsList(userId);
      return;
    }
    const res = await this.groupService.addUserToGroup(groupId, userId);
    if (!res) {
      await this.soldOutMessage(userId);
      return;
    }
    await this.userService.addRegData(userId, 'reg_groupId', groupId);
    // await this.userService.addRegData(userId, 'next_step_data', 'reg_gameName');
    await this.firstStepReg(userId);
  }

  async firstStepReg(userId: number) {
    const buttons = [
      [{ text: 'Покупаю через тебя', callback_data: 'reg_gameName' }],
      [{ text: 'Буду покупать сам', callback_data: '!!!!!!!!!!!' }],
      [{ text: 'Вернуться назад', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Отлично! Теперь выберите как вы будете покупать акцию альянса. (и картинка акции)`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async confirmation(userId: number) {
    const user = await this.userService.getUser(userId);
    if (!user || !user.reg_groupId) return;

    const group = await this.groupService.getGroup(user.reg_groupId);
    if (!group) return;

    const message = [
      'Почти готово! Давайте проверим ваши данные:',
      '',
      `🎓 Группа: ${group.promo}`,
      `🎮 Игровое имя: ${user.reg_gameName || '—'}`,
      `📧 Email: ${user.reg_email || '—'}`,
      `🔒 Пароль: ${user.reg_password || '—'}`,
    ].join('\n');

    const buttons = [
      [{ text: '✅ Всё верно', callback_data: 'succssesRegistrtion' }],
      [{ text: '✏️ Надо исправить', callback_data: 'reg_gameName' }],
    ];

    await this.bot.telegram.sendMessage(userId, message, {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  // async confirmation(userId: number) {
  //   const buttons = [
  //     [{ text: 'Все верно', callback_data: 'succssesRegistrtion' }],
  //     [{ text: 'Надо исправить', callback_data: 'reg_gameName' }],
  //   ];
  //   const user: User | null = await this.userService.getUser(userId);
  //   if (user) {
  //     if (user.reg_groupId) {
  //       const group: Group | null = await this.groupService.getGroup(
  //         user.reg_groupId,
  //       );
  //       if (group) {
  //         await this.bot.telegram.sendMessage(
  //           userId,
  //           `Почти готово! Давайте проверим ваши данные\n${group.promo}\n${user.reg_gameName}\n${user.reg_email}\n${user.reg_password}`,
  //           {
  //             reply_markup: {
  //               inline_keyboard: buttons,
  //             },
  //           },
  //         );
  //       }
  //     }
  //   }
  // }

  async askPassword(userId: number) {
    const buttons = [
      // [{ text: 'Все верно', callback_data: 'succssesRegistrtion' }],
      // [{ text: 'Надо исправить', callback_data: 'reg_gameName' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Теперь напишите пароль от почты что вы ввели`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async askEmail(userId: number) {
    const buttons = [
      // [{ text: 'Надо исправить', callback_data: 'secondStepInSide' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Теперь напишите почту вашего аккаунта`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async askGameName(userId: number) {
    const buttons = [
      // [{ text: 'Надо исправить', callback_data: 'secondStepInSide' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Супер! Пора заполнить ваши данные. Напишите ваше имя в игре`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async soldOutMessage(userId: number) {
    const buttons = [
      [{ text: 'Записаться в другую группу', callback_data: 'takePlace' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `К сожалению, все места уже заняты :( Запишитесь в другую группу или подождите пока мы создадим новую. Актуальную информацию о времени создания новой группы или ходе записи вы можете узнать нажав на кнопку "Чат закупок"`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async extraService(userId: number) {
    const buttons = [[{ text: 'В начало', callback_data: 'mainMenu' }]];
    await this.bot.telegram.sendMessage(
      userId,
      `Кроме доната в игры я могу помочь с оплатой подписок ... текст будет изменен`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async faq(userId: number) {
    const buttons = [
      [{ text: 'Понятно, записываюсь!', callback_data: 'takePlace' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Вот как тут всё устроено: текст будет изменен...`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  // async getListUsersOfGroup(groupName: string) {
  //   const group: Group | null = await this.groupService.getGroup(groupName);
  //   const resList: { index: number; gameName: string }[] = [];
  //   if (group) {
  //     for (const user of group.users) {
  //       if (user) {
  //         const currentUser: User | null = await this.userService.getUser(user);
  //         if (currentUser) {
  //           resList.push({
  //             index: group.users.indexOf(user) + 1,
  //             gameName: currentUser.gameName,
  //           });
  //         }
  //       } else {
  //         resList.push({
  //           index: group.users.indexOf(user) + 1,
  //           gameName: '--',
  //         });
  //       }
  //     }
  //   }
  //   return resList;
  // }

  async getGroupsButtonsList(userId: number) {
    const allGroups = await this.groupService.getGroups();
    const buttons = allGroups.map((gr) => [
      {
        text:
          gr.promo +
          ' ' +
          `(${gr.users.filter((u) => u).length}/${gr.maxCountUsersInGroup})`,
        callback_data: 'reservPlaceInGroup:' + gr._id,
      },
    ]);
    buttons.push([
      { text: 'Обновить', callback_data: 'takePlace' },
      { text: 'В начало', callback_data: 'mainMenu' },
    ]);
    // buttons.push([{ text: 'В начало', callback_data: 'mainMenu' }]);
    await this.bot.telegram.sendMessage(
      userId,
      `Отлично в какую группу вас записать? Продолжая запись вы соглашаетесь на обработку ваших персональныхданных. Если вы не согласны то нажмите кнопку "В начало".`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
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
                callback_data: 'extraService',
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
