import { RegUser } from "./user";

export interface Group {
  _id: string;
  name: string;
  promo: string;
  aliance: string;
  prefix: string;
  users: RegUser[];
  createdAt: Date;
  maxCountUsersInGroup: number;
  telegramGroup?: number;
  messageIdInTelegramGroup?: number;
  maxCountUsersInGroupForKruger: number;
}