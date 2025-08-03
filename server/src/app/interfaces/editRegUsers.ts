export interface EditRegUsers {
  idRegUsersForDeleteOrEdit: string[];
  groupId: string;
  action: 'Delete' | 'Confirm' | 'Unconfirm' | 'Aliance';
  payment: string;
}
