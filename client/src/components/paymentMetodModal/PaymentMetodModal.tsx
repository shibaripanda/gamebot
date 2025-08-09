import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Paper, TextInput, Textarea, Space, Text, Divider, Group } from '@mantine/core';
import { PaymentMetod } from '../../pages/dashboardPage/interfaces/paymentMedod';
import { useState } from 'react';

interface PaymentMetodModalProps {
  paymentsMetods: PaymentMetod[];
  editPaymentsMetods: any;
}

export function PaymentMetodModal({ paymentsMetods, editPaymentsMetods }: PaymentMetodModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [newMetod, setNewMetod] = useState({name: '', data: ''})

  return (
    <>
      <Modal opened={opened} onClose={close} title="Реквизиты">
        {paymentsMetods.map(met =>
          <Paper key={met._id} withBorder style={{padding: '10px', marginBottom: '15px'}}>
            <Group justify='space-between'>
              <Text fw={700}>{met.paymentName}</Text>
              <Button
              size='xs'
              color='red'
              onClick={() => {
              editPaymentsMetods('Delete', met.paymentName, met.paymentData, '');
            }}
            >
            Удалить
            </Button>
          </Group>
          <Divider my="xs" />
          <Text>{met.paymentData}</Text>
          </Paper>
        )}
        <Space h='xl'/>
        <TextInput
        label='Название'
        value={newMetod.name}
        onChange={(v) => {
          setNewMetod({...newMetod, name: v.target.value})
        }}
        />
        <Space h='md'/>
        <Textarea
        resize="vertical"
        label='Реквизиты'
        value={newMetod.data}
        onChange={(v) => {
          setNewMetod({...newMetod, data: v.target.value})
        }}
        />
        <Space h='md'/>
        <Button
        disabled={newMetod.name === '' || newMetod.data === ''}
        onClick={() => {
          editPaymentsMetods('Create', newMetod.name, newMetod.data, '');
          setNewMetod({name: '', data: ''})
        }}>
          Создать
        </Button>
      </Modal>

      <Button 
      variant="default" 
      onClick={open}
      >
        Реквизиты
      </Button>
      </>
  );
}