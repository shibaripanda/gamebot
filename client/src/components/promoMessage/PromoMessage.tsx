import { useDisclosure } from '@mantine/hooks';
import { Modal, Button, Stack, Space, Checkbox, Textarea, Group } from '@mantine/core';
import { Socket } from 'socket.io-client';
import { useState } from 'react';

interface PromoModalProps {
  socket: Socket;
}

export function PromoMessage({ socket }: PromoModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [text, setText] = useState('')
  const [all, setAll] = useState(false)
  const [test, setTest] = useState(false)

  const sendPromoMessage = () => {
    socket.emit('sendPromoMessage', {text: text, all: all});
  }

  const sendTestPromoMessage = () => {
    socket.emit('sendTestPromoMessage', {text: text, all: all});
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Сообщение юзверям">
        <Stack gap="sm">
          <Textarea
            resize="vertical"
            label={'Текст'}
            placeholder="Текст"
            value={text}
            onChange={(v) => {
              setTest(false)
              setText(v.target.value)
            }}
          />
          <Group justify='space-between'>
            <Button
            disabled={text === ''}
            size='xs'
            onClick={async () => {
              sendTestPromoMessage()
              await new Promise((resolve) => setTimeout(resolve, 1500));
              setTest(true)
              }}>
              Тест
            </Button>
            <Checkbox
            label={'Всем'}
            checked={all}
            onChange={(v) => {
              setAll(v.target.checked)
            }}
            />
          </Group>
          
          <Space h="sm" />
          <Button
           disabled={text === '' || !test}
           onClick={() => {
            sendPromoMessage()
            setTest(false)
            }}>
            Отправить
            </Button>
        </Stack>
      </Modal>

      <Button 
      variant="default" 
      onClick={open}
      >
      ✉️
      </Button>
      </>
  );
}