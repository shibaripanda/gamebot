import { Button, Divider, Image, Group as MantineGroup, Modal, Paper, Slider, Space, Switch, Text, Textarea, TextInput } from '@mantine/core';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface SettingsModalProps {
  settingsmModal: boolean;
  settingsmModalUse: any;
  group: Group;
  updateGroupSettings: any;
  deleteGroup: any;
  socket: Socket;
}

export function SettingsModal({ socket, settingsmModal, settingsmModalUse, group, updateGroupSettings, deleteGroup }: SettingsModalProps) {

  const [value, setValue] = useState(group.maxCountUsersInGroupForKruger);
  const [valueGroup, setValueGroup] = useState(group.maxCountUsersInGroup);
  const [groupNameForDelete, setGroupNameForDelete] = useState('');
  const [onOff, setOnOff] = useState(group.hidden);
  const [promoImage, setPromoImage] = useState<string | false>(false)
  const [promoText, setPromoText] = useState<string>(group.promoText)

  useEffect(() => {
    if (settingsmModal)
    socket.emit('getImage', group.image, (response: {success: boolean, message: string, res: string}) => {
      if(!response.success) return
      setPromoImage(response.res)
    });
  }, [settingsmModal])

  const testPromoMessage = () => {
    socket.emit('testPromoMessage', group._id);
  }

  const slider = () => {
      return (
        <>
          <Text size="sm">Максимальное количество мест для не Крюгера: {group.maxCountUsersInGroupForKruger}</Text>
          <Slider
          color="blue"
          min={0}
          max={group.maxCountUsersInGroup}
          labelAlwaysOn
          value={value}
          onChange={setValue}
          marks={[
              { value: 0, label: '0' },
              { value: group.maxCountUsersInGroup, label: group.maxCountUsersInGroup },
          ]}
          />
        </>
      )
  }

   const sliderGlobal = () => {
      return (
        <>
          <Text size="sm">Максимальное количество мест в группе: {group.maxCountUsersInGroup}</Text>
          <Slider
          color="blue"
          min={1}
          max={30}
          labelAlwaysOn
          value={valueGroup}
          onChange={setValueGroup}
          marks={[
              { value: 0, label: '0' },
              { value: 30, label: '30' },
          ]}
          />
        </>
      )
  }

  const offOn = () => {
    return (
      <Switch 
      size="lg" 
      onLabel="ON" 
      offLabel="OFF"
      checked={onOff ? false : true}
      onChange={(event) => setOnOff(!event.target.checked)} 
      />
    )
  }

  return (
    <>
      <Modal opened={settingsmModal} onClose={settingsmModalUse.close} title={"Настройки"}>
        <MantineGroup justify="space-between">
          <Text>{group.name}</Text>
          {offOn()}
        </MantineGroup>
        <Space h='xs'/>
        <Paper withBorder style={{padding: '10px'}}>
          {promoImage ? <Image src={promoImage} alt="Promo image" radius="sm" h='150' /> : ''}
          <Space h='xs'/>
          <Textarea
          resize="vertical"
          value={promoText}
          onChange={(v) => {
            setPromoText(v.target.value)
          }}
          />
          <Space h='xs'/>
          <Button 
          variant={'default'} 
          size='xs'
          onClick={testPromoMessage}
          >Тест</Button>
        </Paper>
        <Space h='xl'/>

        <>{slider()}</>
        <Space h='xl'/>
        <>{sliderGlobal()}</>
        
        <Space h='xl'/>
        <Space h='xl'/>
        <MantineGroup justify="space-between">
          <Button
          onClick={() => {
            setValue(group.maxCountUsersInGroupForKruger)
            setValueGroup(group.maxCountUsersInGroup)
            setPromoText(group.promoText)
            settingsmModalUse.close()
          }}
          >
            Отмена
          </Button>
          <Button
          disabled={
            value === group.maxCountUsersInGroupForKruger && 
            valueGroup === group.maxCountUsersInGroup && 
            onOff === group.hidden &&
            promoText === group.promoText
          }
          onClick={() => {
            updateGroupSettings({groupId: group._id, data: 
              {
                promoText: promoText,
                maxCountUsersInGroupForKruger: value, 
                maxCountUsersInGroup: valueGroup,
                hidden: onOff,
              }})
            // settingsmModalUse.close()
          }}
          >
            Сохранить
          </Button>
        </MantineGroup>
        <Space h='md'/>
        <Divider/>
        <Space h='xs'/>
        <MantineGroup justify="space-between">
          <Button
          color='red'
          disabled={groupNameForDelete !== group.name}
          onClick={() => {
            deleteGroup(group._id)
            settingsmModalUse.close()
          }}
          >
            Удалить
          </Button>
          <TextInput
          placeholder='Имя группы для удаления'
          value={groupNameForDelete}
          onChange={(v) => setGroupNameForDelete(v.target.value)}
          />
        </MantineGroup>
      </Modal>
    </>
  );
}