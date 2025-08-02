import { useState } from 'react';
import cx from 'clsx';
import { Button, Checkbox, Group, ScrollArea, Space, Table } from '@mantine/core';
import classes from './GroupTable.module.css';
import { RegUser } from '../../pages/dashboardPage/interfaces/user';
import { useDisclosure } from '@mantine/hooks';
import { ConfirmModal } from '../confirmModal/ConfirmModal';

interface UserProps {
  users: RegUser[];
  editRegUsers: any;
  groupId: string;
}
export type Actions = 'Delete' | 'Confirm' | false

export function GroupTable({users, editRegUsers, groupId}: UserProps) {
  const [selection, setSelection] = useState<string[]>([]);
  const [сonfirmModal, topConfirmModal] = useDisclosure(false);
  const [action, setAction] = useState<Actions>(false)

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

        <Group justify="flex-end">
            <Button
            color='red'
            disabled={!selection.length}
            onClick={() => {
              setAction('Delete')
              topConfirmModal.open()
            }}
            >
              Delete {selection.length ? selection.length + ' user (s)' : ''}
            </Button>
            <Button 
            color='green'
            disabled={!selection.length}
            onClick={() => {
              setAction('Confirm')
              topConfirmModal.open()
            }}
            >
              Confirm {selection.length ? selection.length + ' user (s)' : ''}
            </Button>  
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
    <ConfirmModal 
    сonfirmModal={сonfirmModal} 
    topConfirmModal={topConfirmModal} 
    editRegUsers={editRegUsers} 
    selection={selection}
    action={action}
    groupId={groupId}
    setSelection={setSelection}
    />
    </>
  );
}