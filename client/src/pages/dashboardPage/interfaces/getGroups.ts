import { Group } from "./group";

export interface GetGroups {
    success: boolean;
    message: string;
    groups: Group[];
}