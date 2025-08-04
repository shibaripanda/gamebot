import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Group,
  GroupDocument,
  UserInGroup,
  UserInGroupDocument,
} from './group.model';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { DataNewReg } from 'src/app/interfaces/dataNewReg';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel('Group') private groupMongo: Model<GroupDocument>,
    @InjectModel('UserInGroup')
    private userInGroupMongo: Model<UserInGroupDocument>,
    private userService: UserService,
    private readonly config: ConfigService,
  ) {}

  async unConfirmUsersInGroup(
    groupId: string,
    userInGroupIds: string[],
  ): Promise<Group | null> {
    const group = await this.groupMongo.findById(groupId);
    if (!group) return null;

    const updates: Record<string, boolean> = {};

    group.users.forEach((u, index) => {
      if (u && userInGroupIds.includes(u._id.toString())) {
        updates[`users.${index}.confirmation`] = false;
      }
    });

    if (Object.keys(updates).length === 0) return null;

    const result = await this.groupMongo.updateOne(
      { _id: groupId },
      { $set: updates },
    );

    if (result.modifiedCount === 0) return null;

    return this.groupMongo.findById(groupId);
  }

  async confirmUserInGroupNoKruger(userId: number): Promise<DataNewReg | null> {
    const user = await this.userService.getUser(userId);
    if (!user) return null;

    const group = await this.groupMongo.findById(user.reg_groupId);
    if (!group) return null;

    const users: (UserInGroup | null)[] = group.users || [];

    const targetIndex = users.findIndex(
      (u) => u?.telegramId === userId && u.status === false,
    );

    if (targetIndex === -1) return null;

    const anonName =
      `${group.prefix}${targetIndex + 1}` + this.getRandomSmile();
    const fieldPath = `users.${targetIndex}`;

    const updateRes = await this.groupMongo.updateOne(
      { _id: user.reg_groupId },
      {
        $set: {
          [`${fieldPath}.status`]: true,
          [`${fieldPath}.gameName`]: user.reg_gameName,
          [`${fieldPath}.email`]: '',
          [`${fieldPath}.password`]: '',
          [`${fieldPath}.anonName`]: anonName,
          [`${fieldPath}.byByKruger`]: false,
          [`${fieldPath}.imagePromoForReg`]: user.reg_screenNoPromo,
        },
      },
    );

    if (updateRes.modifiedCount === 0) return null;

    const updatedGroup = await this.groupMongo.findById(user.reg_groupId);
    const updatedUser = updatedGroup?.users?.[targetIndex];
    console.log(updatedUser, 'ssssssssssssss');

    if (!updatedUser) return null;

    return {
      screenNoPromo: updatedUser.imagePromoForReg,
      kruger: updatedUser.byByKruger,
      groupId: group._id,
      messageIdInTelegramGroup: updatedGroup.messageIdInTelegramGroup,
      status: updatedUser.status,
      date: updatedUser.date,
      anonName: anonName,
      email: updatedUser.email,
      gameName: updatedUser.gameName,
      password: updatedUser.password,
      username: user.username,
      promo: updatedGroup.promo,
      name: updatedGroup.name,
    };
  }

  async confirmUsersInGroup(
    groupId: string,
    userInGroupIds: string[],
  ): Promise<Group | null> {
    const group = await this.groupMongo.findById(groupId);
    if (!group) return null;

    const updates: Record<string, boolean> = {};

    group.users.forEach((u, index) => {
      if (u && userInGroupIds.includes(u._id.toString())) {
        updates[`users.${index}.confirmation`] = true;
      }
    });

    if (Object.keys(updates).length === 0) return null;

    const result = await this.groupMongo.updateOne(
      { _id: groupId },
      { $set: updates },
    );

    if (result.modifiedCount === 0) return null;

    return this.groupMongo.findById(groupId);
  }

  async deleteUsersInGroupAndSetNull(
    groupId: string,
    userInGroupIds: string[],
  ): Promise<Group | null> {
    const group = await this.groupMongo.findById(groupId);
    if (!group) return null;

    const updates: Record<string, null> = {};

    group.users.forEach((u, index) => {
      if (u && userInGroupIds.includes(u._id.toString())) {
        updates[`users.${index}`] = null;
      }
    });

    if (Object.keys(updates).length === 0) return null;

    const result = await this.groupMongo.updateOne(
      { _id: groupId },
      { $set: updates },
    );

    if (result.modifiedCount === 0) return null;

    return this.groupMongo.findById(groupId);
  }

  async updateMessageIdGroup(groupId: string, messageId: number) {
    await this.groupMongo.updateOne(
      { _id: groupId },
      { messageIdInTelegramGroup: messageId },
    );
  }

  async isUnconfirmedUserInTopHalf(
    groupId: string,
    userId: number,
  ): Promise<boolean> {
    const group = await this.groupMongo.findById(groupId);
    if (!group || !group.users) return false;

    const index = group.users.findIndex(
      (u) =>
        u?.telegramId === userId &&
        u.status === false &&
        u.byByKruger === false,
    );

    return index >= 0 && index <= group.maxCountUsersInGroupForKruger - 1;
  }

  async addUserToGroup(groupId: string, userId: number): Promise<boolean> {
    // Очистка просроченных пользователей
    const users: (UserInGroup | null)[] = await this.clearExpiredUsers(groupId);
    console.log(users);
    if (!users.length) return false;
    console.log('step');
    // Проверка: есть ли уже такой пользователь с незавершённой регистрацией
    const existingIndex = users.findIndex(
      (u) => u?.telegramId === userId && u.status === false,
    );

    const now = Date.now();

    if (existingIndex !== -1) {
      // Обновляем только дату
      const fieldPath = `users.${existingIndex}.date`;
      const result = await this.groupMongo.updateOne(
        { _id: groupId },
        { $set: { [fieldPath]: now } },
      );
      return result.modifiedCount > 0;
    }

    // Поиск первой свободной ячейки
    const emptyIndex = users.findIndex((u) => u === null);
    if (emptyIndex === -1) return false;
    console.log('step2');
    const newUser: Pick<UserInGroup, 'telegramId' | 'status' | 'date'> = {
      telegramId: userId,
      status: false,
      date: now,
    };

    const fieldPath = `users.${emptyIndex}`;
    const result = await this.groupMongo.updateOne(
      { _id: groupId }, // защита от гонки
      { $set: { [fieldPath]: newUser } },
    );
    console.log(result.modifiedCount > 0);
    return result.modifiedCount > 0;
  }

  getRandomSmile(): string {
    const smiles = `🐶🐱🐭🐹🐰🦊🐻🐼🐻‍❄️🙈🐵🐸🐽🐷🐮🦁🐯🐨🙉🙊🐒🐔🐧🐦🐤🐣🐥🐴🐗🐺🦇🦉🦅🐦‍⬛️🦆🪿🦄🫎🐝🪱🐛🦋🐌🐞🐜🐢🦂🕸🕷🦗🦟🪳🪲🪰🐍🦎🦖🦕🐙🦑🪼🦐🦞🦭🦈🐋🐳🐬🐟🐠🐡🦀🐊🐅🐆🦓🦍🦧🦣🐘🦛🐄🐂🐃🦬🦘🦒🐫🐪🦏🫏🐎🐖🐏🐑🦙🐐🦌🐕🦃🐓🐈‍⬛🐈🐕‍🦺🦮🐩🦤🦚🦜🦢🦩🕊🐇🦝🦨🦨🦝🐇🕊🦩🦢🦜🦚🦤🦡🦫🦦🦥🐁🐀🐿🦔`;
    const emojis = Array.from(smiles);
    const randomIndex = Math.floor(Math.random() * emojis.length);
    return emojis[randomIndex];
  }

  getRandomTwoDigitNumber(): number {
    return Math.floor(Math.random() * 90) + 10;
  }

  async confirmUserInGroup(userId: number): Promise<DataNewReg | null> {
    const user = await this.userService.getUser(userId);
    if (!user) return null;

    const group = await this.groupMongo.findById(user.reg_groupId);
    if (!group) return null;

    const users: (UserInGroup | null)[] = group.users || [];

    const targetIndex = users.findIndex(
      (u) => u?.telegramId === userId && u.status === false,
    );

    if (targetIndex === -1) return null;

    const anonName =
      `${group.prefix}${targetIndex + 1}` + this.getRandomSmile();
    const fieldPath = `users.${targetIndex}`;

    const updateRes = await this.groupMongo.updateOne(
      { _id: user.reg_groupId },
      {
        $set: {
          [`${fieldPath}.status`]: true,
          [`${fieldPath}.gameName`]: user.reg_gameName,
          [`${fieldPath}.email`]: user.reg_email,
          [`${fieldPath}.password`]: user.reg_password,
          [`${fieldPath}.anonName`]: anonName,
          [`${fieldPath}.byByKruger`]: true,
          [`${fieldPath}.imagePromoForReg`]: user.reg_screenNoPromo,
        },
      },
    );

    if (updateRes.modifiedCount === 0) return null;

    const updatedGroup = await this.groupMongo.findById(user.reg_groupId);
    const updatedUser = updatedGroup?.users?.[targetIndex];
    console.log(updatedUser, 'ssssssssssssss');

    if (!updatedUser) return null;

    return {
      screenNoPromo: updatedUser.imagePromoForReg,
      kruger: updatedUser.byByKruger,
      groupId: group._id,
      messageIdInTelegramGroup: updatedGroup.messageIdInTelegramGroup,
      status: updatedUser.status,
      date: updatedUser.date,
      anonName: anonName,
      email: updatedUser.email,
      gameName: updatedUser.gameName,
      password: updatedUser.password,
      username: user.username,
      promo: updatedGroup.promo,
      name: updatedGroup.name,
    };
  }

  async getGroups(): Promise<Group[]> {
    const groups = await this.groupMongo.find();
    const cleanedGroups: Group[] = [];
    for (const group of groups) {
      const cleanedUsers = await this.clearExpiredUsers(group._id);
      group.users = cleanedUsers;
      cleanedGroups.push(group);
    }
    return cleanedGroups;
  }

  async getGroup(id: string): Promise<Group | null> {
    const group = await this.groupMongo.findOne({ _id: id });
    if (!group) return null;

    const cleanedUsers = await this.clearExpiredUsers(group._id);
    group.users = cleanedUsers;

    return group;
  }

  private async clearExpiredUsers(
    groupId: string,
  ): Promise<(UserInGroup | null)[]> {
    const group = await this.groupMongo.findById(groupId);
    if (!group) return [];

    const users: (UserInGroup | null)[] = group.users || [];
    const maxUsers = group.maxCountUsersInGroup || 30;

    let needsInitialization = false;

    // Инициализируем массив users до нужной длины, если нужно
    while (users.length < maxUsers) {
      users.push(null);
      needsInitialization = true;
    }

    const updates: Record<string, null> = {};

    users.forEach((user, index) => {
      if (user && !user.status && user.date + 600_000 < Date.now()) {
        updates[`users.${index}`] = null;
        users[index] = null;
      }
    });

    // Если массив нужно было инициализировать или были просроченные — делаем обновление
    if (needsInitialization || Object.keys(updates).length > 0) {
      const fullUpdate: Partial<Record<string, any>> = {
        ...updates,
      };

      if (needsInitialization && !group.users) {
        fullUpdate[`users`] = users;
      }

      await this.groupMongo.updateOne({ _id: groupId }, { $set: fullUpdate });
    }

    return users;
  }

  async createGroup(
    newGroup: Pick<Group, 'name' | 'promo' | 'aliance' | 'prefix'>,
  ) {
    return await this.groupMongo.create({
      ...newGroup,
    });
  }
}
