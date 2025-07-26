import * as mongoose from 'mongoose';

export const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
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
  name: string;
  users: number[];
  maxCountUsersInGroup: number;
  telegramGroup?: number;
  messageIdInTelegramGroup?: number;
}

export type GroupDocument = Group & mongoose.Document;
