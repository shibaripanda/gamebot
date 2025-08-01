// export interface User {
//   _id: string;
//   id: number;
//   first_name?: string;
//   username?: string;
//   language_code?: string;
//   blackList: boolean;
//   gameName: string;
//   email: string
// }

export interface RegUser {
  anonName: string;
  date: number;
  email: string;
  gameName: string;
  password: string;
  status: boolean;
  telegramId: number;
}