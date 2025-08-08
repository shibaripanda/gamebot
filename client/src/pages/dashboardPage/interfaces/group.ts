import { RegUser } from "./user";

export interface Group {
  _id: string;
  name: string;
  promo: string;
  aliance: string;
  prefix: string;
  users: RegUser[];
  present: boolean;
  hidden: boolean;
  createdAt: Date;
  maxCountUsersInGroup: number;
  telegramGroup?: number;
  messageIdInTelegramGroup?: number;
  maxCountUsersInGroupForKruger: number;
  image: string;
  finish: boolean;
  promoText: string;
}