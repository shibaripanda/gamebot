import { Group } from "./group";

export interface GetGroup {
    success: boolean;
    message: string;
    group: Group;
}