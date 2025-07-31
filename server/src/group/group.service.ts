import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument, UserInGroup } from './group.model';
import { Model } from 'mongoose';

@Injectable()
export class GroupService {
  constructor(@InjectModel('Group') private groupMongo: Model<GroupDocument>) {}

  async addUserToGroup(groupId: string, userId: number) {
    // Очищаем просроченных
    const users: (UserInGroup | null)[] = await this.clearExpiredUsers(groupId);
    if (!users.length) return false;

    // Ищем первую пустую ячейку
    const emptyIndex = users.findIndex((u) => u === null);
    if (emptyIndex === -1) return false;

    const fieldPath = `users.${emptyIndex}`;
    const updateRes = await this.groupMongo.updateOne(
      {
        _id: groupId,
        [fieldPath]: null, // важно: защита от гонки
      },
      {
        $set: {
          [fieldPath]: {
            telegramId: userId,
            status: false,
            date: Date.now(),
          },
        },
      },
    );

    return updateRes.modifiedCount > 0;
  }

  async getGroups(): Promise<Group[]> {
    const groups = await this.groupMongo.find();
    const cleanedGroups: Group[] = [];
    for (const group of groups) {
      const cleanedUsers = await this.clearExpiredUsers(group._id);
      group.users = cleanedUsers;
      cleanedGroups.push(group);
    }
    console.log(cleanedGroups);
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

    while (users.length < group.maxCountUsersInGroup) {
      users.push(null);
    }
    const updates: Record<string, null> = {};

    users.forEach((user, index) => {
      if (user && !user.status && user.date + 600_000 < Date.now()) {
        updates[`users.${index}`] = null;
        users[index] = null; // локально очищаем
      }
    });

    if (Object.keys(updates).length > 0) {
      await this.groupMongo.updateOne({ _id: groupId }, { $set: updates });
    }

    return users;
  }

  async createGroup(newGroup: Pick<Group, 'name' | 'promo' | 'aliance'>) {
    return await this.groupMongo.create({ ...newGroup });
  }
}
