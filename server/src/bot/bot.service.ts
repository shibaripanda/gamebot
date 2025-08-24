import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { DataNewReg } from 'src/app/interfaces/dataNewReg';
import { Group } from 'src/group/group.model';
import { GroupService } from 'src/group/group.service';
import { UserService } from 'src/user/user.service';
import { Telegraf } from 'telegraf';
import { InlineKeyboardButton, Message } from '@telegraf/types';
import { appText } from 'src/app/texts';
import { User } from 'src/user/user.model';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private groupService: GroupService,
    private userService: UserService,
    private appService: AppService,
  ) {}

  async sendDocument(chatId: number, filePath: string, options?: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.bot.telegram.sendDocument(chatId, { source: filePath }, options);
  }

  async getImage(file_id: string) {
    try {
      const file = await this.bot.telegram.getFile(file_id);
      const fileUrl = `https://api.telegram.org/file/bot${this.config.get<string>('BOT_TOKEN')}/${file.file_path}`;
      const res = await fetch(fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mime = res.headers.get('content-type') || 'image/jpeg';
      return `data:${mime};base64,${base64}`;
    } catch (err) {
      console.error('Ошибка загрузки фото из Telegram:', err);
      return null;
    }
  }

  async broadcastMessageTest(
    text: string,
    all: boolean,
    userId: number,
  ): Promise<void> {
    let buttons: InlineKeyboardButton[][] = [];
    if (!all) {
      buttons = [
        [
          {
            text: 'Подарки от Крюгера',
            callback_data: 'takePlacePresent',
          },
        ],
        [{ text: `В начало`, callback_data: 'mainMenu' }],
      ];
    } else {
      buttons = [[{ text: `В начало`, callback_data: 'mainMenu' }]];
    }

    try {
      await this.bot.telegram
        .sendMessage(userId, text + `\n\n Тест`, {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: 'HTML',
        })
        .then(async (res: Message) => {
          await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
        })
        .catch((e) => {
          console.error(`Ошибка Telegram API для ${userId}:`, e);
        });
    } catch (err) {
      console.error(`Ошибка при отправке пользователю ${userId}:`, err);
    }
  }

  async broadcastMessage(
    text: string,
    all: boolean,
    userId: number,
  ): Promise<void> {
    let userIds: number[] = [];
    let buttons: InlineKeyboardButton[][] = [];
    if (!all) {
      userIds = await this.groupService.getTelegramIdsForPresentPromo();
      buttons = [
        [
          {
            text: 'Подарки от Крюгера',
            callback_data: 'takePlacePresent',
          },
        ],
        [{ text: `В начало`, callback_data: 'mainMenu' }],
      ];
    } else {
      buttons = [[{ text: `В начало`, callback_data: 'mainMenu' }]];
      const list = await this.userService.getUsersId();
      const bunUsers = await this.appService.getBunUsers();

      const bunSet = new Set(bunUsers);
      userIds = list.filter((id) => !bunSet.has(id));
    }

    if (!userIds.length) {
      console.warn('Нет пользователей для рассылки');
      return;
    }
    userIds.push(userId);

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];

      try {
        await this.bot.telegram
          .sendMessage(
            userId,
            userId === userId
              ? text + `\n\n + Рассылка: ${userIds.length - 1} пользователей`
              : text,
            {
              reply_markup: { inline_keyboard: buttons },
              parse_mode: 'HTML',
            },
          )
          .then(async (res: Message) => {
            await this.updateLastMessageAndEditOldMessage(
              userId,
              res.message_id,
            );
          })
          .catch((e) => {
            console.error(`Ошибка Telegram API для ${userId}:`, e);
          });
      } catch (err) {
        console.error(`Ошибка при отправке пользователю ${userId}:`, err);
      }

      // Задержка между сообщениями
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    console.log(`Рассылка завершена: ${userIds.length} пользователей`);
  }

  async adsPromoMessage(groupId: string) {
    const group = await this.groupService.getGroup(groupId);
    const listReceivers = await this.userService.getUserTelegramIds();
    const bunUsers = await this.appService.getBunUsers();

    if (!group || !listReceivers.length) {
      console.error('Group not found or no receivers');
      return false;
    }

    const list = listReceivers.filter((us) => !bunUsers?.includes(us));

    const buttons = [
      [
        {
          text: `${group.promo}`,
          callback_data: 'reservPlaceInGroup:' + group._id,
        },
      ],
      [{ text: `В начало`, callback_data: 'mainMenu' }],
    ];

    for (let i = 0; i < list.length; i++) {
      const userId = list[i];
      try {
        if (!group.image) {
          await this.bot.telegram
            .sendMessage(userId, group.promoText, {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: buttons },
            })
            .then(async (res: Message) => {
              await this.updateLastMessageAndEditOldMessage(
                userId,
                res.message_id,
              );
            })
            .catch((e) => {
              console.log(e);
            });
        } else {
          await this.bot.telegram
            .sendPhoto(userId, group.image, {
              caption: group.promoText,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: buttons },
            })
            .then(async (res: Message) => {
              await this.updateLastMessageAndEditOldMessage(
                userId,
                res.message_id,
              );
            })
            .catch((e) => {
              console.log(e);
            });
        }
      } catch (err) {
        console.error(`Ошибка отправки пользователю ${userId}:`, err);
      }

      // Задержка перед следующим отправлением
      await new Promise((resolve) => setTimeout(resolve, 50)); // 50 мс
    }

    console.log(`Рассылка завершена: ${list.length} пользователей`);
  }

  async testPromoMessage(groupId: string, userId: number) {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      console.error('Group not found');
      return false;
    }
    const buttons = [
      [
        {
          text: `${group.promo}`,
          callback_data: 'reservPlaceInGroup:' + group._id,
        },
      ],
      [
        {
          text: `В начало`,
          callback_data: 'mainMenu',
        },
      ],
    ];
    if (!group.image) {
      await this.bot.telegram
        .sendMessage(userId, group.promoText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons,
          },
        })
        .then(async (res: Message) => {
          await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      await this.bot.telegram
        .sendPhoto(userId, group.image, {
          caption: group.promoText,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buttons,
          },
        })
        .then(async (res: Message) => {
          await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }

  async finishGroupRegistration(group: Group) {
    await this.bot.telegram
      .sendMessage(
        this.config.get<number>('GROUP_TELEGRAM_OPEN')!,
        `🚀 <b>${group.name}</b>\n🚀 Группа закупилась, всем спасибо!`,
        {
          message_thread_id: this.config.get<number>('TOPIC')!,
          parse_mode: 'HTML',
        },
      )
      .catch((e) => {
        console.log(e);
      });
    for (const user of group.users) {
      if (user) {
        await this.bot.telegram
          .sendMessage(
            user.telegramId,
            `🚀 <b>${group.name}</b>\n🚀 Группа закупилась!\n${user.anonName} ${user.gameName}\n/start`,
            { parse_mode: 'HTML' },
          )
          .catch((e) => {
            console.log(e);
          });
      }
    }
    return await this.groupService.closeGroup(group._id);
  }

  async sendRekvizitiToGroupUsers(groupId: string): Promise<Group | false> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      console.error('Group not found');
      return false;
    }
    const rekviz = await this.appService.getPaymentMetods();
    console.log(rekviz);
    if (!rekviz || !rekviz.length) {
      console.error('Rekviz not found');
      return false;
    }

    let wasUpdated = false;

    for (const user of group.users.filter((us) => us?.byByKruger === true)) {
      if (!user || !user.telegramId || user.recivedRekviziti) {
        console.log('Ошибка отправки Реквизитов или уже получено');
        continue;
      }
      const rendom = this.groupService.getRandomArrayElement(rekviz);

      try {
        await this.bot.telegram
          .sendMessage(
            user.telegramId,
            `<b>${user.gameName} (${user.anonName}) ${group.aliance}</b>\nРеквизиты:\n${rendom.paymentData} \n/start`,
            { parse_mode: 'HTML' },
          )
          .then((res: Message) => {
            user.recivedRekviziti = true;
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
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (wasUpdated) {
      await group.save(); // Сохраняем обновлённые флаги пользователей
    }

    // await this.managerMessage(group);

    return group;
  }

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
            `<b>${user.gameName} (${user.anonName})</b>\nАльянс: ${group.aliance}\n/start`,
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
      await new Promise((resolve) => setTimeout(resolve, 50));
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
          `<a href="tg://user?id=${res.telegramId}">🔗 Написать</a>`,
          `🥸 <code>${res.anonName}</code>`,
          `🎮 <code>${res.gameName}</code>`,
          res.email && `📧 <code>${res.email}</code>`,
          res.password && `🔒 <code>${res.password}</code>`,
        ]
          .filter(Boolean)
          .join('\n');
        text = text + '\n-----\n' + message;
      }
    }

    await this.bot.telegram
      .sendMessage(Number(this.config.get<number>('MANAGER')!), text, {
        parse_mode: 'HTML',
      })
      .catch((e) => {
        console.log(e);
      });
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
            `<b>${user.gameName} (${user.anonName})</b>\n💸 Реквизиты:\n ${payment.paymentData}\n/start`,
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
      if (user && user.telegramId && user.byByKruger === true) {
        await this.sendTextMessage(
          user.telegramId,
          `✅ <b>${user.anonName} (${user.gameName})</b>\nМожно заходить на аккаунт, но пока из альянса выходить нельзя ⚠️\n/start`,
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
        `<b>Супер!</b> \nПора заполнить ваши данные. Напишите ваше имя в игре`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
          parse_mode: 'HTML',
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
          caption: `<b>Отлично!</b> \nТеперь выберите как вы будете покупать акцию альянса.`,
          reply_markup: {
            inline_keyboard: buttons,
          },
          parse_mode: 'HTML',
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
          `<b>Отлично!</b> \nТеперь выберите как вы будете покупать акцию альянса.`,
          {
            reply_markup: {
              inline_keyboard: buttons,
            },
            parse_mode: 'HTML',
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

  async deleteMessageFromUser(userId: number, messagId: number) {
    await this.bot.telegram.deleteMessage(userId, messagId).catch((e) => {
      console.log(e);
    });
  }

  async updateLastMessageAndEditOldMessage(userId: number, messagId: number) {
    const mesId: number | undefined = await this.userService.updateLastMessage(
      userId,
      messagId,
    );
    if (mesId)
      await this.bot.telegram.deleteMessage(userId, mesId).catch(async () => {
        await this.bot.telegram
          .editMessageText(userId, mesId, undefined, '.')
          .catch((e) => {
            console.log(e);
          });
      });

    // await this.bot.telegram
    //   .editMessageText(userId, mesId, undefined, '♻️.')
    //   .catch(async () => {
    //     await this.bot.telegram.deleteMessage(userId, mesId).catch((e) => {
    //       console.log(e);
    //     });
    //   });
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
      '<b>Почти готово!</b> \nДавайте проверим ваши данные:',
      '',
      `🎓 <b>Группа:</b> ${group.promo}`,
      `🎮 <b>Игровое имя:</b> ${user.reg_gameName || '—'}`,
      `📧 <b>Email:</b> ${user.reg_email || '—'}`,
      `🔒 <b>Пароль:</b> ${user.reg_password || '—'}`,
    ].join('\n');

    const buttons = [
      [{ text: '✅ Всё верно?', callback_data: 'succssesRegistrtion' }],
      // [{ text: '✏️ Надо исправить', callback_data: 'reg_gameName' }],
      [{ text: '✏️ Надо исправить', callback_data: 'takePlace' }],
    ];

    await this.bot.telegram
      .sendMessage(userId, message, {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML',
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
      await this.timeExpiredPlaceLost(userId);
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
        `<b>Поздравляю!</b> Вы записались в группу! \nНазвание альянса придет сюда как только заполнится группа и мы всех проверим. \nЗа ходом записи вы можете следить в чате закупки. \nВаше кодовое имя: <b>${res.anonName}</b>\n:( Если по каким-либо причинам вы хотите удалиться из записи, то напишите в личные сообщения @crygerm`,
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
      `<a href="tg://user?id=${userId}">🔗 Написать</a>`,
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
        `<b>Поздравляю!</b> Вы записались в группу! \nНазвание альянса придет сюда как только заполнится группа и мы всех проверим. \nЗа ходом записи вы можете следить в чате закупки. \nВаше кодовое имя: <b>${res.anonName}</b>\n:( Если по каким-либо причинам вы хотите удалиться из записи, то напишите в личные сообщения @crygerm`,
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
      `<a href="tg://user?id=${userId}">🔗 Написать</a>`,
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

  async sendFileByFileIdPaymentProof(
    user: User,
    fileId: string,
  ): Promise<void> {
    try {
      const file = await this.bot.telegram.getFile(fileId);
      const filePath = file?.file_path?.toLowerCase() || '';
      const chatId = this.config.get<number>('GROUP_TELEGRAM_CLOSE')!;
      const data = `Оплата: \n${user.first_name} | ${user.username ? '@' + user.username : ''} | ${user.id}`;
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
        `<b>Супер!</b> \nПора заполнить ваши данные. Напишите ваше имя в игре`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
          parse_mode: 'HTML',
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

  async timeExpiredPlaceLost(userId: number) {
    const buttons = [
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
        `Что-то пошло не так, вероятно время брони места в группе закончилось. Попробуйте еще раз.`,
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

  async extraService(userId: number) {
    const buttons = [[{ text: 'В начало', callback_data: 'mainMenu' }]];
    await this.bot.telegram
      .sendMessage(userId, appText.extraServicesText, {
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

  async faqPresent(userId: number) {
    const buttons = [
      [{ text: 'Понятно, записываюсь!', callback_data: 'takePlacePresent' }],
      [{ text: 'В начало', callback_data: 'mainMenu' }],
    ];
    await this.bot.telegram
      .sendMessage(userId, appText.presentHelpText, {
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
      .sendMessage(userId, appText.mainHelpText, {
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
        ? `<b>${step}: ${user.anonName}</b> ${user.confirmation ? '✅' : '⏰'}`
        : `<b>${step}: </b>---------------`;
      userLines.push(label);
      step++;
    }

    // Объединение с разделителем │
    const combinedLines = battery.map((b, i) => `${b} │ ${userLines[i]}`);

    const header = `${group.finish ? '🏁' : ''} ${group.name}\n\n🔸🔸🔸🔸🔸🔸🔸🔸\n🔸<b>${group.promo}</b>\n🔸🔸🔸🔸🔸🔸🔸\n\n`;
    const body = combinedLines.join('\n');
    return `${header}${body}`;
  }

  async confirmUserInGroup(userId: number) {
    const res: DataNewReg | null =
      await this.groupService.confirmUserInGroup(userId);
    console.log(res, 'тут');
    await this.userService.cleaeRegData(userId);
    if (!res) {
      await this.timeExpiredPlaceLost(userId);
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
        `<b>Поздравляю!</b> Вы записались в группу! \nНазвание альянса придет сюда как только заполнится группа и мы всех проверим. \nЗа ходом записи вы можете следить в чате закупки. \nВаше кодовое имя: <b>${res.anonName}</b>\n:( Если по каким-либо причинам вы хотите удалиться из записи, то напишите в личные сообщения @crygerm`,
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
      `<a href="tg://user?id=${userId}">🔗 Написать</a>`,
      `😊 @${res.username}`,
      `🪪 <code>${res.promo}</code>`,
      `🥸 <code>${res.anonName}</code>`,
      `🎮 <code>${res.gameName}</code>`,
      `📧 <code>${res.email}</code>`,
      `🔒 <code>${res.password}</code>`,
    ].join('\n');
    await this.bot.telegram
      .sendMessage(this.config.get<number>('GROUP_TELEGRAM_CLOSE')!, message, {
        parse_mode: 'HTML',
      })
      .catch((e) => {
        console.log(e);
      });
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
        Number(this.config.get<number>('GROUP_TELEGRAM_OPEN')!),
        messageId,
        undefined,
        list,
        {
          parse_mode: 'HTML',
        },
      )
      .catch(async (error) => {
        console.log('ошибка обновления');
        if (
          error instanceof Error &&
          'response' in error &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error as any).response?.error_code === 400 &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (error as any).response?.description !==
            'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message'
        ) {
          await this.sendMessageToGroup(list, groupId);
        } else {
          throw error; // другие ошибки пробрасываем
        }
      });
  }

  async sendMessageToGroup(list: string, groupId: string) {
    const message = await this.bot.telegram
      .sendMessage(this.config.get<number>('GROUP_TELEGRAM_OPEN')!, list, {
        parse_mode: 'HTML',
        message_thread_id: this.config.get<number>('TOPIC')!,
      })
      .catch((e) => {
        console.log(e);
      });
    if (message)
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
        return `<b>Отлично в какую группу вас записать?</b>\nПродолжая запись вы соглашаетесь на обработку ваших персональных данных. \nЕсли вы не согласны то нажмите кнопку "В начало".`;
      }
      buttons.push([
        { text: 'Обновить', callback_data: 'takePlacePresent' },
        { text: 'В начало', callback_data: 'mainMenu' },
      ]);
      return `К сожалению, группа пока не создана или находится в разработке :( За дополнительной информацией обращайтесь к @crygerm`;
    };
    await this.bot.telegram
      .sendMessage(userId, pickTextForEmptyPresents(), {
        reply_markup: {
          inline_keyboard: buttons,
        },
        parse_mode: 'HTML',
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
        `<b>Отлично! в какую группу вас записать?</b>\nПродолжая запись вы соглашаетесь на обработку ваших персональных данных. \nЕсли вы не согласны то нажмите кнопку "В начало".`,
        {
          reply_markup: {
            inline_keyboard: buttons,
          },
          parse_mode: 'HTML',
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
        '<b>Всем привет, это Крюгер-бот!</b>😎 \nЗдесь вы можете записаться на закупку акций альянса!🤝',
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
          parse_mode: 'HTML',
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
      // .then(async (res: Message) => {
      // await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
      // })
      .catch((er) => {
        console.log(er);
      });
  }

  // async sendOneTimeInvite(userId: number) {
  //   const chatId = this.config.get<string>('ID_CHANNEL')!;
  //   const time = Number(this.config.get<string>('TIME_LIFE_LINK')!);
  //   const expireDate = (Math.floor(Date.now() / 1000) + 3600) * time;
  //   const inviteLink = await this.bot.telegram.createChatInviteLink(chatId, {
  //     member_limit: 1,
  //     expire_date: expireDate,
  //     name: `Invite for user ${userId}`,
  //   });
  //   await this.bot.telegram
  //     .sendMessage(
  //       userId,
  //       `Ваша персональная ссылка для вступления в канал (действует следующее количество часов: ${time}):\n${inviteLink.invite_link}`,
  //     )
  //     .then(async (res: Message) => {
  //       await this.updateLastMessageAndEditOldMessage(userId, res.message_id);
  //     })
  //     .catch((er) => {
  //       console.log(er);
  //     });
  // }

  async alertUserHaveAccess(userId: string) {
    const user = await this.userService.getUser(Number(userId));
    await this.bot.telegram.sendMessage(
      Number(this.config.get<number>('MANAGER')!),
      `Выполнен вход в панель администратора\n @${user?.username} | ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Полностью закрыть доступ',
                callback_data: 'closeAccess',
              },
            ],
          ],
        },
      },
    );
  }
}
