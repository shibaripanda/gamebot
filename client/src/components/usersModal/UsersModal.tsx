import { Button, Checkbox, Group, Modal, ScrollArea, Space, Table, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useDisclosure } from '@mantine/hooks';
import classes from './UsersModal.module.css';
import cx from 'clsx';
import { UserApp } from '../../pages/dashboardPage/interfaces/userApp';

interface SettingsModalProps {
  socket: Socket;
  title: string;
  filter: number[];
  butColor: string;
  butDisabled: boolean;
}

export function UsersModal({ socket, title, filter, butColor, butDisabled}: SettingsModalProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [users, setUsers] = useState<UserApp[]>([]);
  const [bunUsers, setBunUsers] = useState<number[]>([])
  const [search, setSearch] = useState('');

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

  const filteredGroups = users.filter((us) => {
    const target = `${us.id} ${us.username} ${us.first_name}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const toggleRow = (id: string) =>
    setSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  const toggleAll = () =>
    setSelection((current) => (current.length === users.length ? [] : users.map((item) => item._id)));

  const getUsers = async () => {
    socket.emit('getUsers', {}, (response: { success: boolean; message: string; users: UserApp[] }) => {
        if (!response.success) return;
        console.log(response.users)
        setUsers([...response.users.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())]);
        if(filter.length) setSelection(response.users.filter(us => filter.includes(us.id)).map(us => us._id));
      });
  }

  const getBunUsers = async () => {
    socket.emit('getBunUsers', {}, (response: { success: boolean; message: string; users: number[] }) => {
        if (!response.success) return;
        setBunUsers([...response.users]);
      });
  }

  const pushBunUsers = () => {
    socket.emit('pushBunUsers', selection, (response: { success: boolean; message: string; users: number[] }) => {
      if (!response.success) return;
      setBunUsers(response.users);
      setSelection([])
    });
  }

  const pullBunUsers = () => {
    socket.emit('pullBunUsers', selection, (response: { success: boolean; message: string; users: number[] }) => {
      if (!response.success) return;
      setBunUsers(response.users);
      setSelection([])
    });
  }

  useEffect(() => {
    if (opened) {
      socket.on('upUsers', (time) => {
      console.log('upUsers:', time);
      getUsers()
      getBunUsers()
    });
      getUsers()
      getBunUsers()
    }
  }, [opened, socket]);

  const rows = [...filteredGroups].map((item) => {
    const selected = selection.includes(item._id);
    return (
      <Table.Tr key={item._id} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox checked={selection.includes(item._id)} onChange={() => toggleRow(item._id)} />
        </Table.Td>
        <Table.Td>{bunUsers.includes(item.id) ? '🔴' : '🟢'}</Table.Td>
        <Table.Td>{item.username ? `@${item.username}` : '---'}</Table.Td>
        <Table.Td>{item.activity}</Table.Td>
        <Table.Td>{item.first_name}</Table.Td>
        <Table.Td>{item.id}</Table.Td>
        <Table.Td>{formatDateOrTime(item.updatedAt)}</Table.Td>
        <Table.Td>{formatDateOrTime(item.createdAt)}</Table.Td>
        <Table.Td>{item._id}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <Modal opened={opened} onClose={close} title={`Люди ${users.length}`} fullScreen>
        <Group>
          <TextInput
          placeholder="Поиск..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            if (selection.length) setSelection([])
          }}
        />
        <Button
        onClick={() => {
          getUsers()
          getBunUsers()
        }}
        >Обновить</Button>
        <Button 
        color='red'
        disabled={selection.length === 0}
        onClick={pushBunUsers}
        >Заблокировать {selection.length > 0 ? selection.length : ''}</Button>
        <Button
        color='green'
        disabled={selection.length === 0}
        onClick={pullBunUsers}
        >Разблокировать {selection.length > 0 ? selection.length : ''}</Button>

        </Group>
        
       <ScrollArea>
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
                       <Table.Th>Status</Table.Th>
                       <Table.Th>@username</Table.Th>
                       <Table.Th>Активность</Table.Th>
                       <Table.Th>Имя</Table.Th>
                       <Table.Th>id</Table.Th>
                       <Table.Th>Обновление</Table.Th>
                       <Table.Th>Дата</Table.Th>
                       <Table.Th>_id</Table.Th>
                   </Table.Tr>
                   </Table.Thead>
                   <Table.Tbody>{rows}</Table.Tbody>
               </Table>
           </ScrollArea>
      </Modal>
      <Button
      color={butColor}
      disabled={butDisabled}  
      variant="default" 
      onClick={open}>
        {title}
      </Button>
    </>
  );
}