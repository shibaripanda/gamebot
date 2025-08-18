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
import { Socket } from 'socket.io-client';
import { UsersModal } from '../usersModal/UsersModal';

interface UserProps {
  users: RegUser[];
  editRegUsers: any;
  groupId: string;
  paymentsMetods: PaymentMetod[];
  group: Group;
  updateGroupSettings: any;
  deleteGroup: any;
  socket: Socket;
}
export type Actions = 
{action: 'Confirm', title: 'Зарегестрировать оплату'} | 
{action: 'Unconfirm', title: 'Отменить регистрацию оплаты'} | 
{action: 'Aliance', title: 'Послать название Альянса'} | 
{action: 'Rekviziti', title: 'Послать реквизиты'} | 
{action: 'Delete', title: 'Удалить запись пользователя на акцию'} | 
{action: 'Bun', title: 'Ограничить доступ пользователя к боту'} |
false

export function GroupTable({socket, users, editRegUsers, groupId, paymentsMetods, group, updateGroupSettings, deleteGroup }: UserProps) {
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
        <Table.Td>{item.telegramUsername}</Table.Td>
        <Table.Td>{item.anonName}</Table.Td>
        <Table.Td><a href={`tg://user?id=${item.telegramId}`}>{item.gameName}</a></Table.Td>
        <Table.Td>{item.email}</Table.Td>
        <Table.Td>{item.password}</Table.Td>
        <Table.Td>{item.recivedAlianceName ? '✉️' : ''}</Table.Td>
        <Table.Td>{item.recivedRekviziti ? '✉️' : ''}</Table.Td>
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
            disabled={!users.some(user => user.recivedAlianceName === false) || users.length < group.maxCountUsersInGroup}
            onClick={() => {
              setSelection([...users.map(user => user._id)]);
              setAction({action: 'Aliance', title: 'Послать название Альянса'})
              topConfirmModal.open()
            }}
            >Альянс</Button>
            <Button
            disabled={
              !users.filter(us => us.byByKruger === true).some(user => user.recivedRekviziti === false) || 
              users.length < group.maxCountUsersInGroup ||
              !users.some(user => user.recivedAlianceName === true)
            }
            onClick={() => {
              setSelection([...users.filter(user => user.byByKruger === true).map(user => user._id)]);
              setAction({action: 'Rekviziti', title: 'Послать реквизиты'})
              topConfirmModal.open()
            }}
            >
            Реквизиты</Button>   
            <Button 
            color='green'
            disabled={!selection.length}
            onClick={() => {
              setAction({action: 'Confirm', title: 'Зарегестрировать оплату'})
              topConfirmModal.open()
            }}
            >
            Оплата</Button>  
            <Button
            disabled={!selection.length}
            onClick={() => {
              setAction({action: 'Unconfirm', title: 'Отменить регистрацию оплаты'})
              topConfirmModal.open()
            }}
            >
            Отмена</Button>
            <Button
            color='red'
            disabled={!selection.length}
            onClick={() => {
              setAction({action: 'Delete', title: 'Удалить запись пользователя на акцию'})
              topConfirmModal.open()
            }}
            >
            Удалить</Button>
            <UsersModal
            butColor='red'
            butDisabled={!selection.length} 
            socket={socket}
            title={'Блок'}
            filter={users.filter(us => selection.includes(us._id)).map(us => us.telegramId)}
            />
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
                <Table.Th>Оплата</Table.Th>
                <Table.Th>@username</Table.Th>
                <Table.Th>Анон Имя</Table.Th>
                <Table.Th>Игровое Имя</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Пароль</Table.Th>
                <Table.Th>Альянс</Table.Th>
                <Table.Th>Реквизиты</Table.Th>
                {/* <Table.Th>Username</Table.Th> */}
                {/* <Table.Th>Status</Table.Th> */}
                <Table.Th>Дата</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    </ScrollArea>
    <SettingsModal
    socket={socket} 
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