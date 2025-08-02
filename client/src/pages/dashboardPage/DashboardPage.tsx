import { Button, Center, Group as MantineGroup, Space, TextInput, useMantineColorScheme } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../../utils/socket";
import { CreateNewGroupModal } from "../../components/createNewGroup/CreateNewGroup";
import { NewGroup } from "./interfaces/newGroup";
import { ServerResponce } from "./interfaces/serverResponce";
import { GetGroups } from "./interfaces/getGroups";
import { Group } from "./interfaces/group";
import { TableGroups } from "../../components/tableGroups/TableGroups";
import { GetGroup } from "./interfaces/getGroup";

export function DashboardPage() {
  const navigate = useNavigate();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroup>({name: '', promo: '', aliance: ''})
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('');

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const filteredGroups = groups.filter((gr) => {
    const target = `${gr.name} ${gr.promo} ${gr.aliance}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const socketRef = useRef<any>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const socket = createSocket(token);
    socketRef.current = socket
    socket.on('connect', () => {
      console.log('Connected', socket.id);
      setIsSocketConnected(true);
    });
    socket.on('message', (msg) => {
      console.log('Message:', msg);
    });
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      // sessionStorage.removeItem('token'); !!!!!!!!!!!!!!!!!!!!!! только dev mode
      // navigate('/');
    });
    return () => {
      socket.disconnect();
      setIsSocketConnected(false);
    };
  }, [navigate]);

  useEffect(() => {
    console.log('useEffect getGroups')
    getGroups()
  }, [isSocketConnected])

  const createNewGroup = (close: () => void) => {
    if (!socketRef.current) return;
    console.log(newGroup)
    socketRef.current.emit('createNewGroup', newGroup, (response: ServerResponce) => {
      console.log('Group creation response:', response);
      if(!response.success) return
      setNewGroup({name: '', promo: '', aliance: ''})
      close()
      setGroups(ex => {return [response.group, ...ex]})
    });

  }

  const getGroups = () => {
    if (!isSocketConnected) return;
     socketRef.current.emit('getGroups', {}, (response: GetGroups) => {
      console.log('Get groups:', response);
      if(!response.success) return
      console.log(response.groups)
      setGroups(response.groups)
    });

  }

  const editRegUsers = (idRegUsersForDelete: string[], groupId: string, action: string) => {
    if (!isSocketConnected) return;
    console.log(idRegUsersForDelete, groupId, action);
    socketRef.current.emit('editRegUsers', {idRegUsersForDelete, groupId, action}, (response: GetGroup) => {
      console.log('editRegUsers:', response);
      if(!response.success) return
      console.log(response.group)
      setGroups(ex =>
        ex.map(group =>
          group._id === response.group._id ? response.group : group
        )
      )
    });
  }

  if(sessionStorage.getItem('token')){
    return (
      <>
      <Center style={{ margin: '10px' }}>
        <MantineGroup justify="center" gap="xs">
          <Button variant="default" onClick={toggleTheme}>
            {colorScheme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <Button onClick={() => {
            sessionStorage.removeItem('token')
            navigate('/')
            }}
          >
          Exit
          </Button>
          <TextInput
            placeholder="Поиск..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            // mb="md"
          />
          <CreateNewGroupModal 
            newGroup={newGroup} 
            setNewGroup={setNewGroup} 
            createNewGroup={createNewGroup}
            existGroupNames={groups.map(gr => gr.name)}
          />
        </MantineGroup>
      </Center>
      <TableGroups editRegUsers={editRegUsers}
        groups={[...filteredGroups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
      />
      </>
    );
  }
}
