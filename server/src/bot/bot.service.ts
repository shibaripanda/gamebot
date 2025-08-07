import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { DataNewReg } from 'src/app/interfaces/dataNewReg';
import { Group } from 'src/group/group.model';
import { GroupService } from 'src/group/group.service';
import { UserService } from 'src/user/user.service';
import { Telegraf } from 'telegraf';
import { Message } from '@telegraf/types';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private groupService: GroupService,
    private userService: UserService,
    private appService: AppService,
  ) {}

  async sendAlianceNameToGroupUsers(groupId: string): Promise<Group | false> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      console.error('Group not found');
      return false;
    }

    let wasUpdated = false;

    for (const user of group.users) {
      if (!user || !user.telegramId || user.recivedAlianceName) {
        console.log('Ошибка отправки Альянса или уже получено');
        continue;
      }

      try {
        await this.bot.telegram
          .sendMessage(
            user.telegramId,
            `<b>${user.gameName} (${user.anonName})</b>\nAliance: ${group.aliance}`,
            { parse_mode: 'HTML' },
          )
          .then((res: Message) => {
            user.recivedAlianceName = true;
            wasUpdated = true;
            console.log(res.message_id);
            // await this.updateLastMessageAndEditOldMessage(
            //   user.telegramId,
            //   res.message_id,
            // );
          })
          .catch((er) => {
            console.log(er);
          });
      } catch (err) {
        console.error(
          `Ошибка при отправке сообщения юзеру ${user.telegramId}`,
          err,
        );
      }
    }

    if (wasUpdated) {
      await group.save(); // Сохраняем обновлённые флаги пользователей
    }

    await this.managerMessage(group);

    return group;
  }

  async managerMessage(group: Group) {
    let text = `${group.name} | ${group.promo} | ${group.aliance} | ${group.present ? '🎁' : ''}`;
    for (const res of group.users) {
      if (res) {
        const message = [
          `${group.users.indexOf(res) + 1}. ${res.byByKruger ? 'Kruger' : 'Сам'}`,
          `🥸 ${res.anonName}`,
          `🎮 ${res.gameName}`,
          res.email && `📧 ${res.email}`,
          res.password && `🔒 ${res.password}`,
        ]
          .filter(Boolean) // удаляет undefined/false/null/'' элементы
          .join('\n');
        text = text + '\n-\n' + message;
      }
    }
    // for (const res of group.users) {
    //   if (res) {
    //     const message = [
    //       `${group.users.indexOf(res) + 1}. ${res.byByKruger ? 'Kruger' : 'Сам'}`,
    //       `🥸 <code>${res.anonName}</code>`,
    //       `🎮 <code>${res.gameName}</code>`,
    //       `📧 <code>${res.email}</code>`,
    //       `🔒 <code>${res.password}</code>`,
    //     ].join('\n');
    //     text = text + '\n-----\n' + message;
    //   }
    // }

    await this.bot.telegram.sendMessage(
      Number(this.config.get<number>('MANAGER')!),
      `<pre>${text}</pre>`,
      { parse_mode: 'HTML' },
    );
  }

  async sendPaymentToKrugerUsers(
    groupId: string,
    regUsersIds: string[],
    paymentId: string,
  ): Promise<Group | false> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      console.error('Group not found');
      return false;
    }

    const payment = await this.appService.getPaymentMetod(paymentId);
    if (!payment) {
      console.error('Payment not found');
      return false;
    }

    // Проходим по переданным _id пользователей
    for (const userId of regUsersIds) {
      const user = group.users.find((u) => u?._id?.toString() === userId);
      if (!user || !user.telegramId) {
        console.warn(
          `User with ID ${userId} not found in group or has no telegramId`,
        );
        continue;
      }

      try {
        await this.bot.telegram
          .sendMessage(
            user.telegramId,
            `<b>${user.gameName} (${user.anonName})</b>\n💸 Реквизиты:\n ${payment.paymentData}`,
            { parse_mode: 'HTML' },
          )
          .then(async (res: Message) => {
            await this.updateLastMessageAndEditOldMessage(
              user.telegramId,
              res.message_id,
            );
          })
          .catch((er) => {
            console.log(er);
          });
      } catch (err) {
        console.error(
          `Ошибка при отправке сообщения юзеру ${user.telegramId}`,
          err,
        );
      }
    }

    return group;
  }

  async notifyUsersInGroupByIdsConfirmation(
    groupId: string,
    userIds: string[],
  ): Promise<void> {
    const group = await this.groupService.getGroup(groupId);
    if (!group || !group.users) return;

    const usersToNotify = group.users.filter(
      (user) =>
        user && userIds.includes(user._id?.toString() ?? user.confirmation),
    );

    for (const user of usersToNotify) {
      if (user && user.telegramId) {
        await this.sendTextMessage(
          user.telegramId,
          `✅ <b>${user.anonName} (${user.gameName})</b>\nМожно заходить на аккаунт, но пока из альянса выходить нельзя ⚠️`,
        );
      }
    }
  }

  async startRegistrationByMe(userId: number, groupId: string) {
    const group = await this.groupService.getGroup(groupId);
    console.log(group);
    if (!group) {
      await this.getGroupsButtonsList(userId);
      return;
    }
    const res = await this.groupService.isUnconfirmedUserInTopHalf(
      groupId,
      userId,
    );
    if (!res) {
      console.log('soldOut');
      await this.soldOutMessage(userId);
      return;
    }
    await this.userService.addRegData(userId, 'reg_groupId', groupId);
    await this.userService.addRegData(
      userId,
      'next_step_data',
      'reg_screenNoPromo',
    );
    await this.firstStepRegNoKruger(userId);
  }

  async firstStepRegNoKruger(userId: number) {
    const buttons = [[{ text: 'Вернуться назад', callback_data: 'mainMenu' }]];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Хорошо, следующим шагом необходимо прислать сюда скриншот экрана для подтверждения того, что данная акция еще не куплена.`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async startRegistrationPresent(userId: number, groupId: string) {
    const group = await this.groupService.getGroup(groupId);
    console.log(group);
    if (!group) {
      await this.getGroupsButtonsList(userId);
      return;
    }
    const res = await this.groupService.addUserToGroup(groupId, userId);
    if (!res) {
      console.log('soldOutPresent');
      await this.soldOutMessagePresent(userId);
      return;
    }
    await this.userService.addRegData(userId, 'reg_groupId', groupId);
    await this.userService.addRegData(
      userId,
      'next_step_data',
      'reg_gameNamePresent',
    );
    await this.firstStepRegPresent(userId);
  }

  async firstStepRegPresent(userId: number) {
    const buttons = [
      [
        { text: 'Назад', callback_data: 'takePlacePresent' },
        { text: 'В начало', callback_data: 'mainMenu' },
      ],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Супер! Пора заполнить ваши данные. Напишите ваше имя в игре`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

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
    await this.firstStepReg(userId, groupId, group.image);
  }

  async buyByMe(userId: number, groupId: string) {
    const buttons = [
      [
        {
          text: 'Честно покупаю сам',
          callback_data: `buyByMeStartReg:${groupId}`,
        },
      ],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Без проблем! Но есть ограничения:
1- По количеству мест. Вы должны успеть записаться в первых рядах, либо придется ждать следующий старт группы.
2- Записываться к нам в закупки, покупая акцию не у нас, строго запрещено! Прошу, если вы покупаете не самостоятельно, а через другой сервис - не тратьте наше время. Мы узнаем.`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async firstStepReg(userId: number, groupId: string, image: string) {
    const buttons = [
      [{ text: 'Покупаю через тебя', callback_data: 'reg_gameName' }],
      [{ text: 'Буду покупать сам', callback_data: `buyByMe:${groupId}` }],
      [{ text: 'Вернуться назад', callback_data: 'mainMenu' }],
    ];
    if (image) {
      await this.bot.telegram
        .sendPhoto(userId, image, {
          caption: `Отлично! Теперь выберите как вы будете покупать акцию альянса.`,
          reply_markup: {
            inline_keyboard: buttons,
          },
        })
        .then(async (res: Message.PhotoMessage) => {
          await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
        })
        .catch((err) => {
          console.log('Ошибка при отправке фото:', err);
        });
    } else {
      await this.bot.telegram
        .sendMessage(
          userId,
          `Отлично! Теперь выберите как вы будете покупать акцию альянса.`,
          {
            reply_markup: {
              inline_keyboard: buttons,
            },
          },
        )
        .then(async (res: Message.TextMessage) => {
          await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
        })
        .catch((err) => {
          console.log('Ошибка при отправке сообщения:', err);
        });
    }
  }

  async updateLastMessageAndEditOldMessage(userId: number, messagId: number) {
    const mesId: number | undefined = await this.userService.updateLastMessage(
      userId,
      messagId,
    );
    if (mesId)
      await this.bot.telegram
        .editMessageText(userId, mesId, undefined, '♻️.')
        .catch(async () => {
          await this.bot.telegram.deleteMessage(userId, mesId).catch((e) => {
            console.log(e);
          });
        });
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

    await this.bot.telegram
      .sendMessage(userId, message, {
        reply_markup: { inline_keyboard: buttons },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async confirmationNoKruger(userId: number) {
    const res: DataNewReg | null =
      await this.groupService.confirmUserInGroupNoKruger(userId);
    console.log(res, 'тут');
    await this.userService.cleaeRegData(userId);
    if (!res) {
      return;
    }
    const buttons = [
      [
        {
          text: 'В чат закупок',
          url: this.config.get<string>('CHAT_ZAKUPOK')!,
        },
      ],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Поздравляю! Вы записались в группу! Название альянса придет сюда как только заполнится группа и мы всех проверим. За ходом записи вы можете следить в чате закупки. Ваше кодовое имя: <b>${res.anonName}</b>:( Если по каким-либо причинам вы хотите удалиться из записи, то напишите в личные сообщения @crygerm`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
    const message = [
      `Регистрация: <code>${res.name}</code> ${res.kruger ? 'Kruger' : 'Сам'}`,
      '',
      `😊 @${res.username}`,
      `🪪 <code>${res.promo}</code>`,
      `🥸 <code>${res.anonName}</code>`,
      `🎮 <code>${res.gameName}</code>`,
    ].join('\n');
    // await this.bot.telegram.sendMessage(
    //   this.config.get<number>('GROUP_TELEGRAM_CLOSE')!,
    //   message,
    //   {
    //     parse_mode: 'HTML',
    //   },
    // );
    await this.sendFileByFileId(res.screenNoPromo, message);
    await this.sendOrUpdateMessage(res.groupId, res.messageIdInTelegramGroup);
  }

  async confirmationPresent(userId: number) {
    const res: DataNewReg | null =
      await this.groupService.confirmUserInGroupNoKruger(userId);
    console.log(res, 'тут');
    await this.userService.cleaeRegData(userId);
    if (!res) {
      return;
    }
    const buttons = [
      [
        {
          text: 'В чат закупок',
          url: this.config.get<string>('CHAT_ZAKUPOK')!,
        },
      ],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Поздравляю! Вы записались в группу! Название альянса придет сюда как только заполнится группа и мы всех проверим. За ходом записи вы можете следить в чате закупки. Ваше кодовое имя: <b>${res.anonName}</b>:( Если по каким-либо причинам вы хотите удалиться из записи, то напишите в личные сообщения @crygerm`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
    const message = [
      `Регистрация: <code>${res.name}</code> Подарок`,
      '',
      `😊 @${res.username}`,
      `🪪 <code>${res.promo}</code>`,
      `🥸 <code>${res.anonName}</code>`,
      `🎮 <code>${res.gameName}</code>`,
    ].join('\n');
    await this.bot.telegram
      .sendMessage(this.config.get<number>('GROUP_TELEGRAM_CLOSE')!, message, {
        parse_mode: 'HTML',
      })
      .then((res: Message) => {
        console.log(res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
    // await this.sendFileByFileId(res.screenNoPromo, message);
    await this.sendOrUpdateMessage(res.groupId, res.messageIdInTelegramGroup);
  }

  async sendFileByFileId(fileId: string, data: string): Promise<void> {
    try {
      const file = await this.bot.telegram.getFile(fileId);
      const filePath = file?.file_path?.toLowerCase() || '';
      const chatId = this.config.get<number>('GROUP_TELEGRAM_CLOSE')!;

      if (
        filePath.endsWith('.jpg') ||
        filePath.endsWith('.jpeg') ||
        filePath.endsWith('.png') ||
        filePath.endsWith('.webp')
      ) {
        await this.bot.telegram.sendPhoto(chatId, fileId, {
          caption: data,
          parse_mode: 'HTML',
        });
      } else if (filePath.endsWith('.pdf')) {
        await this.bot.telegram.sendDocument(chatId, fileId, {
          caption: data,
          parse_mode: 'HTML',
        });
      } else {
        await this.bot.telegram.sendDocument(chatId, fileId, {
          caption: data,
          parse_mode: 'HTML',
        });
      }
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
      throw new Error('Не удалось отправить файл по file_id.');
    }
  }

  async askPassword(userId: number) {
    const buttons = [];
    await this.bot.telegram
      .sendMessage(userId, `Теперь напишите пароль от почты что вы ввели`, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async askEmail(userId: number) {
    const buttons = [];
    await this.bot.telegram
      .sendMessage(userId, `Теперь напишите почту вашего аккаунта`, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async askGameName(userId: number) {
    const buttons = [];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Супер! Пора заполнить ваши данные. Напишите ваше имя в игре`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async soldOutMessagePresent(userId: number) {
    const buttons = [
      [
        {
          text: 'Записаться в другую группу',
          callback_data: 'takePlacePresent',
        },
      ],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
      [
        {
          text: 'В чат закупок',
          url: this.config.get<string>('CHAT_ZAKUPOK')!,
        },
      ],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `К сожалению, все места уже заняты :( Запишитесь в другую группу или подождите пока мы создадим новую. Актуальную информацию о времени создания новой группы или ходе записи вы можете узнать нажав на кнопку "Чат закупок"`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async soldOutMessage(userId: number) {
    const buttons = [
      [{ text: 'Записаться в другую группу', callback_data: 'takePlace' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `К сожалению, все места уже заняты :( Запишитесь в другую группу или подождите пока мы создадим новую. Актуальную информацию о времени создания новой группы или ходе записи вы можете узнать нажав на кнопку "Чат закупок"`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async extraService(userId: number) {
    const buttons = [[{ text: 'В начало', callback_data: 'mainMenu' }]];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Кроме доната в игры я могу помочь с оплатой подписок ... текст будет изменен`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async faqPresent(userId: number) {
    const buttons = [
      [{ text: 'Понятно, записываюсь!', callback_data: 'takePlacePresent' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(userId, `Вот как тут всё устроено: текст будет изменен...`, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async faq(userId: number) {
    const buttons = [
      [{ text: 'Понятно, записываюсь!', callback_data: 'takePlace' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(userId, `Вот как тут всё устроено: текст будет изменен...`, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
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

  async confirmUserInGroup(userId: number) {
    const res: DataNewReg | null =
      await this.groupService.confirmUserInGroup(userId);
    console.log(res, 'тут');
    await this.userService.cleaeRegData(userId);
    if (!res) {
      return;
    }
    const buttons = [
      [
        {
          text: 'В чат закупок',
          url: this.config.get<string>('CHAT_ZAKUPOK')!,
        },
      ],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(
        userId,
        `Поздравляю! Вы записались в группу! Реквизиты для оплаты и название альянса придет сюда как только заполнится группа. За ходом записи вы можете следить в чате закупки. Ваше кодовое имя <b>${res.anonName}</b>`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
    const message = [
      `Регистрация: <code>${res.name}</code> ${res.kruger ? 'Kruger' : 'Сам'}`,
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
  }

  async sendOrUpdateMessage(groupId: string, messageId: number | undefined) {
    console.log('попытка');
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
        console.log('ошибка обновления');
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

  async getGroupsButtonsListPresent(userId: number) {
    const allGroups = await this.groupService.getGroupsForButtonsPresent();
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
          callback_data: 'reservPlaceInPresentGroup:' + gr._id,
        },
      ];
    });
    const pickTextForEmptyPresents = () => {
      if (allGroups.length) {
        buttons.push([{ text: 'За что подарки', callback_data: 'faqPresent' }]);
        buttons.push([
          { text: 'Обновить', callback_data: 'takePlacePresent' },
          { text: 'В начало', callback_data: 'mainMenu' },
        ]);
        return `Отлично в какую группу вас записать? Продолжая запись вы соглашаетесь на обработку ваших персональныхданных. Если вы не согласны то нажмите кнопку "В начало".`;
      }
      buttons.push([
        { text: 'Обновить', callback_data: 'takePlacePresent' },
        { text: 'В начало', callback_data: 'mainMenu' },
      ]);
      return `ТО- К сожалению, группа пока не создана или находится в разработке :( За дополнительной информацией обращайтесь к @crygerm`;
    };
    await this.bot.telegram
      .sendMessage(userId, pickTextForEmptyPresents(), {
        reply_markup: {
          inline_keyboard: buttons,
        },
      })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async getGroupsButtonsList(userId: number) {
    const allGroups = await this.groupService.getGroupsForButtons();
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
    await this.bot.telegram
      .sendMessage(
        userId,
        `Отлично в какую группу вас записать? Продолжая запись вы соглашаетесь на обработку ваших персональныхданных. Если вы не согласны то нажмите кнопку "В начало".`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async startMessage(userId: number) {
    await this.bot.telegram
      .sendMessage(
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
                  callback_data: 'takePlacePresent',
                },
              ],
              [
                {
                  text: 'Дополнительные услуги',
                  callback_data: 'extraService',
                },
              ],
            ],
          },
        },
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
  }

  async sendTextMessage(userId: number, text: string) {
    await this.bot.telegram
      .sendMessage(userId, text, { parse_mode: 'HTML' })
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
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
    await this.bot.telegram
      .sendMessage(
        userId,
        `Ваша персональная ссылка для вступления в канал (действует следующее количество часов: ${time}):\n${inviteLink.invite_link}`,
      )
      .then(async (res: Message) => {
        await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      })
      .catch((er) => {
        console.log(er);
      });
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
