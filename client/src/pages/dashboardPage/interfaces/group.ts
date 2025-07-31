import { User } from "./user";

export interface Group {
  _id: string;
  name: string;
  promo: string;
  aliance: string;
  users: User[];
  createdAt: Date;
  maxCountUsersInGroup: number;
  telegramGroup?: number;
  messageIdInTelegramGroup?: number;
}