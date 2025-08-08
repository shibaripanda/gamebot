import * as mongoose from 'mongoose';

export const UserInGroupSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      require: true,
    },
    status: {
      type: Boolean,
      default: false,
      require: true,
    },
    date: {
      type: Number,
      require: true,
    },
    gameName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    anonName: {
      type: String,
      require: true,
    },
    byByKruger: {
      type: Boolean,
      default: false,
      require: true,
    },
    imagePromoForReg: {
      type: String,
    },
    confirmation: {
      type: Boolean,
      default: false,
      require: true,
    },
    recivedAlianceName: {
      type: Boolean,
      default: false,
      require: true,
    },
    recivedRekviziti: {
      type: Boolean,
      default: false,
      require: true,
    },
    telegramUsername: {
      type: String,
      require: true,
      default: '',
    },
  },
  { timestamps: false },
);

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
    prefix: {
      type: String,
      require: true,
    },
    users: {
      type: [UserInGroupSchema],
      default: [],
      require: true,
    },
    maxCountUsersInGroup: {
      type: Number,
      default: 30,
      require: true,
    },
    maxCountUsersInGroupForKruger: {
      type: Number,
      default: 15,
      require: true,
    },
    messageIdInTelegramGroup: {
      type: Number,
      require: false,
    },
    present: {
      type: Boolean,
      require: true,
      default: false,
    },
    hidden: {
      type: Boolean,
      require: true,
      default: true,
    },
    image: {
      type: String,
      require: true,
      default: '',
    },
    finish: {
      type: Boolean,
      require: true,
      default: false,
    },
    finishTime: {
      type: Number,
      require: true,
      default: 0,
    },
    promoText: {
      type: String,
      require: true,
      default: 'Текст акции для рассылки',
    },
  },
  { timestamps: true },
);

export interface UserInGroup {
  _id: string;
  telegramId: number;
  status: boolean;
  date: number;
  gameName: string;
  email: string;
  password: string;
  anonName: string;
  byByKruger: boolean;
  imagePromoForReg: string;
  confirmation: boolean;
  screenNoPromo: string;
  recivedAlianceName: boolean;
  recivedRekviziti: boolean;
  telegramUsername: string;
}

export interface Group {
  _id: string;
  name: string;
  promo: string;
  aliance: string;
  prefix: string;
  present: boolean;
  hidden: boolean;
  users: (UserInGroup | null)[];
  maxCountUsersInGroup: number;
  messageIdInTelegramGroup?: number;
  maxCountUsersInGroupForKruger: number;
  image: string;
  finish: boolean;
  finishTime: number;
  promoText: string;
}

export type GroupDocument = Group & mongoose.Document;

export type UserInGroupDocument = UserInGroup & mongoose.Document;
