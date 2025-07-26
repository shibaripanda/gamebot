import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      require: true,
      unique: true,
    },
    first_name: {
      type: String,
      require: true,
      default: '',
    },
    username: {
      type: String,
      require: true,
      default: '',
    },
    language_code: {
      type: String,
      require: true,
      default: '',
    },
    blackList: {
      type: Boolean,
      require: true,
      default: false,
    },
    gameName: {
      type: String,
      require: true,
      default: 'Noname',
    },
  },
  { timestamps: true },
);

export interface User {
  id: number;
  first_name?: string;
  username?: string;
  language_code?: string;
  blackList: boolean;
  gameName: string;
}

export type UserDocument = User & mongoose.Document;
