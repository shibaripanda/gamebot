import { Accordion, Button, Container, Group as GroupMantine, Group as MantineGroup } from '@mantine/core';
import classes from './TableGroups.module.css';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { GroupTable } from '../groupTable/GroupTable';
import { RegUser } from '../../pages/dashboardPage/interfaces/user';

interface GroupsProps {
  groups: Group[];
}

export function TableGroups({groups}: GroupsProps) {

    if(!groups.length) return

    const fullEmptyGroup = (group: Group) => {
        return (
            <>
            {group.users.filter(user => user && user.status === true).length} / {group.maxCountUsersInGroup}
            </>
        )
    }

    return (
        <Container size="xl" className={classes.wrapper}>
    
        <Accordion variant="separated">

            {groups.map((gr)=> 
                <Accordion.Item className={classes.item} value={gr._id} key={gr._id}>
                    <Accordion.Control>
                        <MantineGroup>
                           <GroupMantine justify="space-between">
                            {gr.name} 🔸 {gr.promo} 🔸 {gr.aliance} 🔸 {fullEmptyGroup(gr)}
                            </GroupMantine>
                        </MantineGroup>
                        </Accordion.Control>
                    <Accordion.Panel>
                        <GroupTable users={gr.users.filter(user => user && user.status === true)}/>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            
        </Accordion>
        </Container>
    );
}