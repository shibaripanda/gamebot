import { Group } from "./group";

export interface ServerResponce {
    success: boolean;
    message: string;
    group: Group;
}