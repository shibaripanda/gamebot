import { Button, Group as MantineGroup, Modal, Slider, Space, Switch, Text, TextInput } from '@mantine/core';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { useState } from 'react';

interface SettingsModalProps {
  settingsmModal: boolean;
  settingsmModalUse: any;
  group: Group;
  updateGroupSettings: any;
  deleteGroup: any;
}

export function SettingsModal({ settingsmModal, settingsmModalUse, group, updateGroupSettings, deleteGroup }: SettingsModalProps) {

  const [value, setValue] = useState(group.maxCountUsersInGroupForKruger);
  const [valueGroup, setValueGroup] = useState(group.maxCountUsersInGroup);
  const [groupNameForDelete, setGroupNameForDelete] = useState('');
  const [onOff, setOnOff] = useState(group.hidden);

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
        <Space h='xl'/>
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
            settingsmModalUse.close()
          }}
          >
            Отмена
          </Button>
          <Button
          disabled={value === group.maxCountUsersInGroupForKruger && valueGroup === group.maxCountUsersInGroup && onOff === group.hidden}
          onClick={() => {
            updateGroupSettings({groupId: group._id, data: 
              {
                maxCountUsersInGroupForKruger: value, 
                maxCountUsersInGroup: valueGroup,
                hidden: onOff,
              }})
            settingsmModalUse.close()
          }}
          >
            Сохранить
          </Button>
        </MantineGroup>
        <Space h='xl'/>
        <MantineGroup justify="space-between">
          <TextInput
          placeholder='Имя группы для удаления'
          value={groupNameForDelete}
          onChange={(v) => setGroupNameForDelete(v.target.value)}
          />
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
        </MantineGroup>
      </Modal>
    </>
  );
}