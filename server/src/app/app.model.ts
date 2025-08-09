import * as mongoose from 'mongoose';

export const PaymentMetodSchema = new mongoose.Schema(
  {
    paymentName: {
      type: String,
      default: 'PayMetod',
    },
    paymentData: {
      type: String,
      default: '',
    },
  },
  { timestamps: false },
);

export const AppSchema = new mongoose.Schema(
  {
    app: {
      type: String,
      unique: true,
      default: 'gameBot',
    },
    paymentMetods: {
      type: [PaymentMetodSchema],
      default: [],
    },
    webAccess: {
      type: Boolean,
      require: true,
      default: true,
    },
    bunUsers: {
      type: Array,
      require: true,
      default: [],
    },
    fishImage: {
      type: String,
      require: true,
      default: '',
    },
  },
  { timestamps: true },
);

export interface PaymentMetod {
  // _id: string;
  paymentName: string;
  paymentData: string;
}

export interface App {
  paymentMetods: [PaymentMetod];
  webAccess: boolean;
  bunUsers: number[];
  fishImage: string;
}

export type PaymentMetodDocument = PaymentMetod & mongoose.Document;
export type AppDocument = App & mongoose.Document;
