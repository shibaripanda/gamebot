import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Center, TextInput, Stack, Space } from '@mantine/core';
import { NewGroup } from '../../pages/dashboardPage/interfaces/newGroup';

interface CreateNewGroupModalProps {
  newGroup: NewGroup;
  setNewGroup: React.Dispatch<React.SetStateAction<NewGroup>>;
  createNewGroup: any;
}

export function CreateNewGroupModal({ newGroup, setNewGroup, createNewGroup }: CreateNewGroupModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Center style={{ margin: '10px' }}>
      <Modal opened={opened} onClose={close} title="Создать группу">
        <Stack gap="sm">
          <TextInput 
            label="Название группы" 
            placeholder="Введите название группы"
            value={newGroup.name}
            onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
          />
          <TextInput 
            label="Название акции" 
            placeholder="Введите название акции"
            value={newGroup.promo}
            onChange={(e) => setNewGroup(prev => ({ ...prev, promo: e.target.value }))}
          />
          <TextInput 
            label="Название альянса" 
            placeholder="Введите название альянса"
            value={newGroup.aliance}
            onChange={(e) => setNewGroup(prev => ({ ...prev, aliance: e.target.value }))}
          />
          <Space h="sm" />
          <Button onClick={
            () => createNewGroup(close)
            }>
            Сохранить
            </Button>
        </Stack>
      </Modal>

      <Button variant="default" onClick={open}>
        Создать новую группу
      </Button>
    </Center>
  );
}