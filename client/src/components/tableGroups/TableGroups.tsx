import { Accordion, Container, Group as GroupMantine, Group as MantineGroup, Slider } from '@mantine/core';
import classes from './TableGroups.module.css';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { GroupTable } from '../groupTable/GroupTable';
import { PaymentMetod } from '../../pages/dashboardPage/interfaces/paymentMedod';

interface GroupsProps {
  groups: Group[];
  editRegUsers: any;
  paymentsMetods: PaymentMetod[];
}

export function TableGroups({groups, editRegUsers, paymentsMetods }: GroupsProps) {

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
                        />
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            
        </Accordion>
        </Container>
    );
}