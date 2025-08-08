export interface UserApp {
    _id: string;
    id: number;
    first_name?: string;
    username?: string;
    language_code?: string;
    blackList: boolean;
    reg_gameName?: string;
    reg_email?: string;
    reg_password?: string;
    reg_groupId?: string;
    reg_screenNoPromo?: string;
    next_step_data?: string;
    lastMessage: number;
    createdAt: Date;
    updatedAt: Date;
}