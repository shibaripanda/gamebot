import { Button, Group as MantineGroup, Modal, Slider, Space, Text } from '@mantine/core';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { useState } from 'react';

interface SettingsModalProps {
  settingsmModal: boolean;
  settingsmModalUse: any;
  group: Group;
}

export function SettingsModal({ settingsmModal, settingsmModalUse, group }: SettingsModalProps) {

  const [value, setValue] = useState(group.maxCountUsersInGroupForKruger);
  const [valueGroup, setValueGroup] = useState(group.maxCountUsersInGroup);

  const slider = () => {
      return (
        <>
          <Text size="sm">Максимальное количество юзеров Крюгера: {group.maxCountUsersInGroupForKruger}</Text>
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
          <Text size="sm">Максимальное количество юзеров: {group.maxCountUsersInGroup}</Text>
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

  return (
    <>
      <Modal opened={settingsmModal} onClose={settingsmModalUse.close} title="Настройки">
        <Text>{group.name}</Text>
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
          disabled={value === group.maxCountUsersInGroupForKruger && valueGroup === group.maxCountUsersInGroup}
          onClick={() => {
            settingsmModalUse.close()
          }}
          >
            Сохранить
          </Button>
        </MantineGroup>
      </Modal>
    </>
  );
}