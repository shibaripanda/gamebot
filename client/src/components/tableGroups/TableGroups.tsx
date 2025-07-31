import { Accordion, Button, Container, Group as MantineGroup } from '@mantine/core';
import classes from './TableGroups.module.css';
import { Group } from '../../pages/dashboardPage/interfaces/group';
import { GroupTable } from '../groupTable/GroupTable';

interface GroupsProps {
  groups: Group[];
}

export function TableGroups({groups}: GroupsProps) {

    if(!groups.length) return

    return (
        <Container size="xl" className={classes.wrapper}>
    
        <Accordion variant="separated">

            {groups.map((gr)=> 
                <Accordion.Item className={classes.item} value={gr._id} key={gr._id}>
                    <Accordion.Control>
                        <MantineGroup>
                           {gr.name} 🔸 {gr.promo} 🔸 {gr.aliance}
                        </MantineGroup>
                        </Accordion.Control>
                    <Accordion.Panel>
                        <GroupTable users={gr.users}/>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            
        </Accordion>
        </Container>
    );
}