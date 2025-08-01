import { useState } from 'react';
import cx from 'clsx';
import { Avatar, Button, Checkbox, Group, ScrollArea, Space, Table, Text } from '@mantine/core';
import classes from './GroupTable.module.css';
import { RegUser } from '../../pages/dashboardPage/interfaces/user';

interface UserProps {
  users: RegUser[];
}

export function GroupTable({users}: UserProps) {
  const [selection, setSelection] = useState<string[]>([]);

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
    setSelection((current) => (current.length === users.length ? [] : users.map((item) => item.anonName)));

  const rows = users.map((item) => {
    const selected = selection.includes(item.anonName);
    return (
      <Table.Tr key={item.anonName} className={cx({ [classes.rowSelected]: selected })}>
        <Table.Td>
          <Checkbox checked={selection.includes(item.anonName)} onChange={() => toggleRow(item.anonName)} />
        </Table.Td>
        <Table.Td>
          <Group gap="sm">
            <Avatar size={26} radius={26}>
              {item.anonName[item.anonName.length - 1]}
            </Avatar>
            <Text size="sm" fw={500}>
              {item.anonName}
            </Text>
          </Group>
        </Table.Td>
        <Table.Td>{item.gameName}</Table.Td>
        <Table.Td>{item.email}</Table.Td>
        <Table.Td>{item.password}</Table.Td>
        {/* <Table.Td>{item.status}</Table.Td> */}
        <Table.Td>{formatDateOrTime(item.date)}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <ScrollArea>

        <Group justify="flex-end">
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
                    checked={selection.length === users.length}
                    indeterminate={selection.length > 0 && selection.length !== users.length}
                />
                </Table.Th>
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
  );
}