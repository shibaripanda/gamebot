export interface EditRegUsers {
  idRegUsersForDelete: string[];
  groupId: string;
  action: 'Delete' | 'Confirm';
}
