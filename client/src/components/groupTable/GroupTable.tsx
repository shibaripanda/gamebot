import { useState } from 'react';
import cx from 'clsx';
import { Button, Checkbox, Group as MantineGroup, ScrollArea, Space, Table, Text } from '@mantine/core';
import classes from './GroupTable.module.css';
import { RegUser } from '../../pages/dashboardPage/interfaces/user';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmModal } from '../confirmModal/ConfirmModal';
import { PaymentMetod } from '../../pages/dashboardPage/interfaces/paymentMedod';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { SettingsModal } from '../settingsModal/SettingsModal';

interface UserProps {
  users: RegUser[];
  editRegUsers: any;
  groupId: string;
  paymentsMetods: PaymentMetod[];
  group: Group;
  updateGroupSettings: any;
  deleteGroup: any;
}
export type Actions = 'Delete' | 'Confirm' | 'Unconfirm' | 'Aliance' | 'Rekviziti' | false

export function GroupTable({users, editRegUsers, groupId, paymentsMetods, group, updateGroupSettings, deleteGroup }: UserProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const [сonfirmModal, topConfirmModal] = useDisclosure(false);
  const [action, setAction] = useState<Actions>(false)
  const [settingsmModal, settingsmModalUse] = useDisclosure(false);

  function formatDateOrTime(input: Date | string | number): string {
  const date = new Date(input);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return isToday
    ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ru-RU');
}
  const toggleRow = (id: string) =>
    setSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  const toggleAll = () =>
    setSelection((current) => (current.length === users.length ? [] : users.map((item) => item._id)));

  const rows = users.map((item) => {
    const selected = selection.includes(item._id);
    return (
      <Table.Tr key={item._id} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox checked={selection.includes(item._id)} onChange={() => toggleRow(item._id)} />
        </Table.Td>
        <Table.Td>{item.confirmation ? '✅' : '⏰'}</Table.Td>
        <Table.Td>{item.anonName}</Table.Td>
        <Table.Td>{item.gameName}</Table.Td>
        <Table.Td>{item.email}</Table.Td>
        <Table.Td>{item.password}</Table.Td>
        {/* <Table.Td>{item.status}</Table.Td> */}
        <Table.Td>{formatDateOrTime(item.date)}</Table.Td>
      </Table.Tr>
    );
  });



  return (
    <>
    <ScrollArea>
        <MantineGroup justify="space-between">
          <Button
          variant='default'
          onClick={settingsmModalUse.open}
          >
          Настройки
          </Button>
          <MantineGroup justify="flex-end">
            <Text>
              {selection.length ? selection.length + ' user (s)' : ''}
            </Text>
            <Button
            color='red'
            disabled={!selection.length}
            onClick={() => {
              setAction('Delete')
              topConfirmModal.open()
            }}
            >
            Удалить</Button>
            <Button
            disabled={users.length !== group.maxCountUsersInGroup}
            onClick={() => {
              setSelection([...users.map(user => user._id)]);
              setAction('Aliance')
              topConfirmModal.open()
            }}
            >Альянс</Button>
            <Button
            disabled={users.length === group.maxCountUsersInGroup}
            onClick={() => {
              setSelection([...users.filter(user => user.byByKruger === true).map(user => user._id)]);
              setAction('Rekviziti')
              topConfirmModal.open()
            }}
            >
            Реквизиты</Button>   
            <Button 
            color='green'
            disabled={!selection.length}
            onClick={() => {
              setAction('Confirm')
              topConfirmModal.open()
            }}
            >
            Оплата</Button>  
            <Button
            disabled={!selection.length}
            onClick={() => {
              setAction('Unconfirm')
              topConfirmModal.open()
            }}
            >
            Отмена оплаты</Button>
          </MantineGroup>
        </MantineGroup>
        <Space h='xl'/>
        <Table miw={800} verticalSpacing="sm">
            <Table.Thead>
            <Table.Tr>
                <Table.Th w={40}>
                <Checkbox
                    onChange={toggleAll}
                    checked={selection.length === users.length}
                    indeterminate={selection.length > 0 && selection.length !== users.length}
                />
                </Table.Th>
                <Table.Th>Confirm</Table.Th>
                <Table.Th>Anon Name</Table.Th>
                <Table.Th>Game Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Password</Table.Th>
                {/* <Table.Th>Username</Table.Th> */}
                {/* <Table.Th>Status</Table.Th> */}
                <Table.Th>Date</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    </ScrollArea>
    <SettingsModal 
    settingsmModal={settingsmModal} 
    settingsmModalUse={settingsmModalUse}
    group={group}
    updateGroupSettings={updateGroupSettings}
    deleteGroup={deleteGroup}
    />
    <ConfirmModal 
    сonfirmModal={сonfirmModal} 
    topConfirmModal={topConfirmModal} 
    editRegUsers={editRegUsers} 
    selection={selection}
    action={action}
    groupId={groupId}
    setSelection={setSelection}
    paymentsMetods={paymentsMetods}
    />
    </>
  );
}