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
    reg_gameName: {
      type: String,
      require: true,
      default: '',
    },
    reg_email: {
      type: String,
      require: true,
      default: '',
    },
    reg_password: {
      type: String,
      require: true,
      default: '',
    },
    reg_groupId: {
      type: String,
      require: true,
      default: '',
    },
    next_step_data: {
      type: String,
      require: true,
      default: '',
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
  reg_gameName?: string;
  reg_email?: string;
  reg_password?: string;
  reg_groupId?: string;
  next_step_data?: string;
}

export type UserDocument = User & mongoose.Document;
