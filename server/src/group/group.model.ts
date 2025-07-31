import * as mongoose from 'mongoose';

export interface UserInGroup {
  telegramId: number;
  status: boolean;
  date: number;
}

export const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      require: true,
    },
    promo: {
      type: String,
      require: true,
    },
    aliance: {
      type: String,
      require: true,
    },
    users: {
      type: Array,
      default: [],
      require: true,
    },
    maxCountUsersInGroup: {
      type: Number,
      default: 30,
      require: true,
    },
    telegramGroup: {
      type: Number,
      require: false,
    },
    messageIdInTelegramGroup: {
      type: Number,
      require: false,
    },
  },
  { timestamps: true },
);

export interface Group {
  _id: string;
  name: string;
  promo: string;
  aliance: string;
  users: UserInGroup[];
  maxCountUsersInGroup: number;
  telegramGroup?: number;
  messageIdInTelegramGroup?: number;
}

export type GroupDocument = Group & mongoose.Document;
