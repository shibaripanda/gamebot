import { Button, Group, Modal, Space } from '@mantine/core';
import { Actions } from '../groupTable/GroupTable';
import { PaymentMetod } from '../../pages/dashboardPage/interfaces/paymentMedod';

interface ConfirmModalModalProps {
  сonfirmModal: any;
  topConfirmModal: any;
  editRegUsers: any;
  selection: string[];
  action: Actions;
  groupId: string;
  setSelection: any;
  paymentsMetods: PaymentMetod[];
}

export function ConfirmModal({ сonfirmModal, topConfirmModal, editRegUsers, selection, action, groupId, setSelection }: ConfirmModalModalProps) {

  const buttons = () => {
        return (
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
      )
  }
  return (
    <>
      <Modal opened={сonfirmModal} onClose={topConfirmModal.close} title="⚠️ Подтверждение" centered>
        <Group justify="space-between">
          {buttons()}
          <Button
          onClick={() => {
            setSelection([])
            topConfirmModal.close()
          }}
          >
            Отмена
          </Button>
        </Group>
      </Modal>
      </>
  );
}