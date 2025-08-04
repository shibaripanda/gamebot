import { Accordion, Container, Group as GroupMantine, Group as MantineGroup } from '@mantine/core';
import classes from './TableGroups.module.css';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { GroupTable } from '../groupTable/GroupTable';
import { PaymentMetod } from '../../pages/dashboardPage/interfaces/paymentMedod';

interface GroupsProps {
  groups: Group[];
  editRegUsers: any;
  paymentsMetods: PaymentMetod[];
  updateGroupSettings: any;
  deleteGroup: any;
}

export function TableGroups({groups, editRegUsers, paymentsMetods, updateGroupSettings, deleteGroup }: GroupsProps) {

    if(!groups.length) return

    const fullEmptyGroup = (group: Group) => {
        return (
            <>
            {group.users.filter(user => user && user.status === true).length} / {group.maxCountUsersInGroupForKruger} / {group.maxCountUsersInGroup}
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
                            {gr.name} 🔸 {gr.promo} 🔸 {gr.aliance} 🔸 {gr.prefix} 🔸 {fullEmptyGroup(gr)}
                            </GroupMantine>
                        </MantineGroup>
                        </Accordion.Control>
                    <Accordion.Panel>
                        <GroupTable 
                        users={gr.users.filter(user => user && user.status === true)} 
                        editRegUsers={editRegUsers} 
                        groupId={gr._id}
                        paymentsMetods={paymentsMetods}
                        group={gr}
                        updateGroupSettings={updateGroupSettings}
                        deleteGroup={deleteGroup}
                        />
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            
        </Accordion>
        </Container>
    );
}