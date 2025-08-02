import { Button, Group, Modal } from '@mantine/core';
import { Actions } from '../groupTable/GroupTable';


interface ConfirmModalModalProps {
  сonfirmModal: any;
  topConfirmModal: any;
  editRegUsers: any;
  selection: string[];
  action: Actions;
  groupId: string;
  setSelection: any;
}

export function ConfirmModal({ сonfirmModal, topConfirmModal, editRegUsers, selection, action, groupId, setSelection}: ConfirmModalModalProps) {

  return (
    <>
      <Modal opened={сonfirmModal} onClose={topConfirmModal.close} title="⚠️ Подтверждение" centered>
        <Group justify="space-between">
          <Button
          color={action === 'Delete' ? 'red' : 'green'}
          onClick={async () =>{
            if(action){
              await editRegUsers(selection, groupId, action)
              setSelection([])
              topConfirmModal.close()
            }
          }}>
            {action}
          </Button>
          <Button
          onClick={topConfirmModal.close}
          >
            Отмена
          </Button>
        </Group>
      </Modal>
      </>
  );
}