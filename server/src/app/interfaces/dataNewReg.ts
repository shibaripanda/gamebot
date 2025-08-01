export interface DataNewReg {
  groupId: string;
  messageIdInTelegramGroup?: number;
  telegramGroup?: number;
  status: boolean;
  date: number;
  anonName: string;
  email: string;
  gameName: string;
  password: string;
  username?: string;
  promo: string;
  name: string;
}
