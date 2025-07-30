import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Group, GroupDocument } from './group.model';
import { Model } from 'mongoose';

@Injectable()
export class GroupService {
  constructor(@InjectModel('Group') private groupMongo: Model<GroupDocument>) {}

  async getGroups(): Promise<Group[]> {
    const groupRes: Group[] = await this.groupMongo.find({});
    return groupRes;
  }

  async getGroup(name: string): Promise<Group | null> {
    const groupRes: Group | null = await this.groupMongo.findOne({
      name: name,
    });
    return groupRes;
  }

  async isUserInGroup(groupId: string, userId: number): Promise<boolean> {
    const group: Group | null = await this.groupMongo.findById(groupId);
    if (!group) return false;
    return group.users.includes(userId);
  }

  async getFirstEmptySlot(groupId: string): Promise<number | null> {
    const group: Group | null = await this.groupMongo.findById(groupId);
    if (!group) throw new Error('Group not found');
    const index = group.users.findIndex((u) => !u);
    return index >= 0 ? index : null;
  }

  async groupIsFull(groupId: string): Promise<boolean> {
    const slot = await this.getFirstEmptySlot(groupId);
    return slot === null;
  }

  async removeUserFromGroup(groupId: string, userId: number) {
    const group: Group | null = await this.groupMongo.findOne({ _id: groupId });

    if (!group || !Array.isArray(group.users)) {
      throw new Error('Group not found or users array missing');
    }

    const index = group.users.findIndex((u) => u === userId);

    if (index === -1) {
      console.log('User not found in group');
      return;
    }

    const fieldPath = `users.${index}`;

    const res = await this.groupMongo.updateOne(
      { _id: groupId },
      { $set: { [fieldPath]: null } },
    );

    console.log(`User ${userId} removed from index ${index}`);
    console.log(res);
  }

  async addUserToGroup(groupId: string, userId: number, kruger: boolean) {
    const group: Group | null = await this.groupMongo.findOne({ _id: groupId });

    if (!group) {
      throw new Error('Group not found');
    }

    const users: (number | null)[] = group.users || [];

    while (users.length < group.maxCountUsersInGroup) {
      users.push(null);
    }

    if (users.includes(userId)) {
      throw new Error('User already in group');
    }

    const emptyIndex = users.findIndex((u) => !u);

    if (emptyIndex === -1) {
      throw new Error('Group is full');
    }

    if (emptyIndex > 19 && !kruger) {
      throw new Error('Only for Kruger');
    }

    // Обновить только нужную ячейку
    const fieldPath = `users.${emptyIndex}`;
    const updateRes = await this.groupMongo.updateOne(
      { _id: groupId },
      { $set: { [fieldPath]: userId } },
    );

    console.log('User added at index', emptyIndex + 1);
    console.log(updateRes);
  }

  async deleteGroup(name: string) {
    const groupRes = await this.groupMongo.deleteOne({ name: name });
    console.log(groupRes);
  }

  async createGroup(newGroup: Pick<Group, 'name' | 'promo' | 'aliance'>) {
    return await this.groupMongo.create({ ...newGroup });
  }
}
