import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { DataNewReg } from 'src/app/interfaces/dataNewReg';
import { Group } from 'src/group/group.model';
import { GroupService } from 'src/group/group.service';
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
      console.log('soldOut');
      await this.soldOutMessage(userId);
      return;
    }
    await this.userService.addRegData(userId, 'reg_groupId', groupId);
    // await this.userService.addRegData(userId, 'next_step_data', 'reg_gameName');
    await this.firstStepReg(userId);
  }

  async buyByMe(userId: number) {
    const buttons = [
      [{ text: 'Честно покупаю сам', callback_data: 'buyByMeStartReg' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Без проблем! Но есть ограничения:
1- По количеству мест. Вы должны успеть записаться в первых рядах, либо придется ждать следующий старт группы.
2- Записываться к нам в закупки, покупая акцию не у нас, строго запрещено! Прошу, если вы покупаете не самостоятельно, а через другой сервис - не тратьте наше время. Мы узнаем.`,
      {
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
  }

  async firstStepReg(userId: number) {
    const buttons = [
      [{ text: 'Покупаю через тебя', callback_data: 'reg_gameName' }],
      [{ text: 'Буду покупать сам', callback_data: 'buyByMe' }],
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
    if (
      !user ||
      !user.reg_groupId ||
      !user.reg_email ||
      !user.reg_gameName ||
      !user.reg_password
    )
      return;

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
      [{ text: '✅ Всё верно?', callback_data: 'succssesRegistrtion' }],
      // [{ text: '✏️ Надо исправить', callback_data: 'reg_gameName' }],
      [{ text: '✏️ Надо исправить', callback_data: 'takePlace' }],
    ];

    await this.bot.telegram.sendMessage(userId, message, {
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async askPassword(userId: number) {
    const buttons = [];
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
    const buttons = [];
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
    const buttons = [];
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

  async getListUsersOfGroup(groupId: string): Promise<string> {
    const group: Group | null = await this.groupService.getGroup(groupId);
    if (!group) return 'Ошибка';

    const users = group.users || [];
    const total = group.maxCountUsersInGroup || users.length;
    const filledUsers = [...users];

    while (filledUsers.length < total) {
      filledUsers.push(null);
    }

    const filledCount = filledUsers.filter((u) => u?.confirmation).length;

    // Батарея — снизу вверх
    const battery: string[] = [];
    for (let i = 0; i < total; i++) {
      battery.push(i < filledCount ? '🔋' : '🪫');
    }
    battery.reverse();

    // Пользователи
    const userLines: string[] = [];
    let step = 1;
    for (const user of filledUsers) {
      const label = user?.status
        ? `<b>${step}: ${user.confirmation ? '✅🚀' : '⏰🚀'} ${user.anonName}</b>`
        : `<b>${step}: </b>---------------`;
      userLines.push(label);
      step++;
    }

    // Объединение с разделителем │
    const combinedLines = battery.map((b, i) => `${b} │ ${userLines[i]}`);

    const header = `${group.name}\n\n🔸🔸🔸🔸🔸🔸🔸🔸\n🔸<b>${group.promo}</b>\n🔸🔸🔸🔸🔸🔸🔸\n\n`;
    const body = combinedLines.join('\n');
    return `${header}${body}`;
  }

  // async getListUsersOfGroup(groupId: string): Promise<string> {
  //   const group: Group | null = await this.groupService.getGroup(groupId);
  //   let step = 1;
  //   if (group) {
  //     let list = `${group.name}\n🔸🔸🔸🔸🔸🔸🔸🔸\n🔸${group.promo}\n🔸🔸🔸🔸🔸🔸🔸🔸\n`;
  //     for (const user of group.users) {
  //       if (user && user.status) {
  //         list = list + `🔋 <b>${step}: ` + user.anonName + '</b> 🚀\n';
  //       } else {
  //         list = list + `🪫<b>${step}: </b>` + '---' + '\n';
  //       }
  //       step++;
  //     }
  //     return list;
  //   }
  //   return 'Ошибка';
  // }

  async confirmUserInGroup(userId: number) {
    const res: DataNewReg | null =
      await this.groupService.confirmUserInGroup(userId);
    console.log(res, 'тут');
    await this.userService.cleaeRegData(userId);
    if (!res) {
      return;
    }
    const buttons = [
      [{ text: 'Чат закупок', callback_data: '!!!!!!!!!!' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram.sendMessage(
      userId,
      `Поздравляю! Вы записались в группу! Реквизиты для оплаты и название альянса придет сюда как только заполнится группа. За ходом записи вы можете следить в чате закупки. Ваше кодовое имя <b>${res.anonName}</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons,
        },
      },
    );
    const message = [
      `Регистрация: <code>${res.name}</code>`,
      '',
      `😊 @${res.username}`,
      `🪪 <code>${res.promo}</code>`,
      `🥸 <code>${res.anonName}</code>`,
      `🎮 <code>${res.gameName}</code>`,
      `📧 <code>${res.email}</code>`,
      `🔒 <code>${res.password}</code>`,
    ].join('\n');
    await this.bot.telegram.sendMessage(
      this.config.get<number>('GROUP_TELEGRAM_CLOSE')!,
      message,
      {
        parse_mode: 'HTML',
      },
    );
    await this.sendOrUpdateMessage(res.groupId, res.messageIdInTelegramGroup);
    // const list = await this.getListUsersOfGroup(res.groupId);
    // if (!res.messageIdInTelegramGroup) {
    //   await this.sendMessageToGroup(list, res.groupId);
    //   return;
    // }
    // await this.bot.telegram
    //   .editMessageText(
    //     this.config.get<number>('GROUP_TELEGRAM_OPEN'),
    //     res.messageIdInTelegramGroup,
    //     undefined,
    //     list,
    //     { parse_mode: 'HTML' },
    //   )
    //   .catch(async (error) => {
    //     if (
    //       error instanceof Error &&
    //       'response' in error &&
    //       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //       (error as any).response?.error_code === 400
    //     ) {
    //       await this.sendMessageToGroup(list, res.groupId);
    //     } else {
    //       throw error; // другие ошибки пробрасываем
    //     }
    //   });
  }

  async sendOrUpdateMessage(groupId: string, messageId: number | undefined) {
    const list = await this.getListUsersOfGroup(groupId);
    if (!messageId) {
      await this.sendMessageToGroup(list, groupId);
      return;
    }
    await this.bot.telegram
      .editMessageText(
        this.config.get<number>('GROUP_TELEGRAM_OPEN'),
        messageId,
        undefined,
        list,
        { parse_mode: 'HTML' },
      )
      .catch(async (error) => {
        if (
          error instanceof Error &&
          'response' in error &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error as any).response?.error_code === 400
        ) {
          await this.sendMessageToGroup(list, groupId);
        } else {
          throw error; // другие ошибки пробрасываем
        }
      });
  }

  async sendMessageToGroup(list: string, groupId: string) {
    const message = await this.bot.telegram.sendMessage(
      this.config.get<number>('GROUP_TELEGRAM_OPEN')!,
      list,
      { parse_mode: 'HTML' },
    );
    await this.groupService.updateMessageIdGroup(groupId, message.message_id);
    return;
  }

  async getGroupsButtonsList(userId: number) {
    const allGroups = await this.groupService.getGroups();
    const buttons = allGroups.map((gr) => {
      const total = gr.maxCountUsersInGroup;

      const allFilled = gr.users.filter((u) => u !== null);
      const actualFilled = allFilled.length;

      const hasReserved = gr.users.some(
        (u) => u?.telegramId === userId && u.status === false,
      );

      const displayedCount = hasReserved
        ? Math.max(actualFilled - 1, 0)
        : actualFilled;

      // Успешные регистрации пользователя
      const confirmedRegs = gr.users.filter(
        (u) => u?.telegramId === userId && u.status === true,
      );

      let suffix = '';
      if (confirmedRegs.length > 0) {
        suffix =
          confirmedRegs.length === 1 ? ' 😊' : ` 😊×${confirmedRegs.length}`;
      }

      if (hasReserved) {
        suffix += ' ⏳';
      }

      return [
        {
          text: `${gr.promo} (${displayedCount}/${total})${suffix}`,
          callback_data: 'reservPlaceInGroup:' + gr._id,
        },
      ];
    });
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
