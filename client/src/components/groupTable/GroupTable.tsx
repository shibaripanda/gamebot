import { useState } from 'react';
import cx from 'clsx';
import { Avatar, Button, Checkbox, Group, ScrollArea, Space, Table, Text } from '@mantine/core';
import classes from './GroupTable.module.css';
import { User } from '../../pages/dashboardPage/interfaces/user';

const data = [
  {
    _id: '1',
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png',
    gameName: 'Robert Wolfkisser',
    email: 'rob_wolf@gmail.com',
    username: '@ssfsfsfs'
  },
  {
    _id: '2',
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png',
    gameName: 'Jill Jailbreaker',
    email: 'jj@breaker.com',
    username: '@ssfsfsfs'
  },
  {
    _id: '3',
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png',
    gameName: 'Henry Silkeater',
    email: 'henry@silkeater.io',
    username: '@ssfsfsfs'
  },
  {
    _id: '4',
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-3.png',
    gameName: 'Bill Horsefighter',
    email: 'bhorsefighter@gmail.com',
    username: '@ssfsfsfs'
  },
  {
    _id: '5',
    avatar:
      'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-10.png',
    gameName: 'Jeremy Footviewer',
    email: 'jeremy@foot.dev',
    username: '@ssfsfsfs'
  },
];

interface UserProps {
  users: User[];
}

export function GroupTable({users}: UserProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const toggleRow = (id: string) =>
    setSelection((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  const toggleAll = () =>
    setSelection((current) => (current.length === data.length ? [] : data.map((item) => item._id)));

  const rows = data.map((item) => {
    const selected = selection.includes(item._id);
    return (
      <Table.Tr key={item._id} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox checked={selection.includes(item._id)} onChange={() => toggleRow(item._id)} />
        </Table.Td>
        <Table.Td>
          <Group gap="sm">
            <Avatar size={26} src={item.avatar} radius={26} />
            <Text size="sm" fw={500}>
              {item.gameName}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>{item.email}</Table.Td>
        <Table.Td>{item.username}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <ScrollArea>

        <Group justify="center">
            <Button>Button 1</Button>
            <Button>Button 2</Button>  
            <Button>Button 3</Button>  
            <Button>Button 4</Button> 
            <Button>Button 5</Button>    
        </Group>
        <Space h='xl'/>
        <Table miw={800} verticalSpacing="sm">
            <Table.Thead>
            <Table.Tr>
                <Table.Th w={40}>
                <Checkbox
                    onChange={toggleAll}
                    checked={selection.length === data.length}
                    indeterminate={selection.length > 0 && selection.length !== data.length}
                />
                </Table.Th>
                <Table.Th>Game Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Telegram username</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    </ScrollArea>
  );
}