import { Button, Center, Group as MantineGroup, Text, TextInput, useMantineColorScheme } from "@mantine/core";
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
import { PaymentMetodModal } from "../../components/paymentMetodModal/PaymentMetodModal";
import { PaymentMetod } from "./interfaces/paymentMedod";
import { GetPaymentMetods } from "./interfaces/getPaymentMetods";
import { UsersModal } from "../../components/usersModal/UsersModal";

function formatUpdatedTime(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}


export function DashboardPage() {
  const navigate = useNavigate();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [newGroup, setNewGroup] = useState<NewGroup>({name: '', promo: '', aliance: '', prefix: '', present: false})
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('');
  const [paymentsMetods, setPaymentMetods] = useState<PaymentMetod[]>([])
  const [lastTimeUpdate, setLastTimeUpdate] = useState(Date.now())
  // const [isSocketConnected, setIsSocketConnected] = useState(false);
  const isSocketConnectedRef = useRef(false);


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
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected', socket.id);
      setIsSocketConnected(true);
      isSocketConnectedRef.current = true; // обновляем ref
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
      isSocketConnectedRef.current = false;
    });

    socket.on('upData', (time) => {
      console.log('upData:', time);
      console.log('isSocketConnected inside upData:', isSocketConnectedRef.current);
      if (!isSocketConnectedRef.current) return;

      getGroups();
      getPamentMetods();
      setLastTimeUpdate(time);
    });

    socket.on('closeAccess', () => {
      sessionStorage.removeItem('token');
      navigate('/');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      // sessionStorage.removeItem('token'); // для dev режима
      // navigate('/');
    });

    return () => {
      socket.disconnect();
      setIsSocketConnected(false);
      isSocketConnectedRef.current = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (isSocketConnectedRef.current) {
      getGroups();
      getPamentMetods();
    }
  }, [isSocketConnected]);

  const getGroups = () => {
    if (!isSocketConnectedRef.current) return;
    socketRef.current.emit('getGroups', {}, (response: GetGroups) => {
      if(!response.success) return;
      console.log(response.groups);
      setGroups(response.groups);
    });
  };

  const getPamentMetods = () => {
    if (!isSocketConnectedRef.current) return;
    socketRef.current.emit('getPaymentMetods', {}, (response: GetPaymentMetods) => {
      if(!response.success) return;
      setPaymentMetods(response.metods);
    });
  };

  const createNewGroup = (close: () => void) => {
    if (!socketRef.current) return;
    socketRef.current.emit('createNewGroup', newGroup, (response: ServerResponce) => {
      if(!response.success) return;
      setNewGroup({name: '', promo: '', aliance: '', prefix: '', present: false});
      close();
      setGroups(ex => [response.group, ...ex]);
    });
  };

  const deleteGroup = (groupId : string) => {
    if (!isSocketConnectedRef.current) return;
    socketRef.current.emit('deleteGroup', groupId, (response: {success: boolean, message: string, group: string}) => {
      if(!response.success) return;
      console.log(response);
      setGroups(ex => ex.filter(group => group._id !== response.group));
    });
  };

  const updateGroupSettings = (data: object) => {
    if (!isSocketConnectedRef.current) return;
    console.log(data);
    socketRef.current.emit('updateGroupSettings', data, (response: GetGroup) => {
      if(!response.success) return;
      console.log(response.group);
      setGroups(ex => ex.map(group => group._id === response.group._id ? response.group : group));
    });
  };

  const editRegUsers = (idRegUsersForDeleteOrEdit: string[], groupId: string, action: string, payment: string) => {
    if (!isSocketConnectedRef.current) return;
    console.log(idRegUsersForDeleteOrEdit, groupId, action);
    socketRef.current.emit('editRegUsers', {idRegUsersForDeleteOrEdit, groupId, action, payment}, (response: GetGroup) => {
      console.log('editRegUsers:', response);
      if(!response.success) return;
      console.log(response.group);
      setGroups(ex => ex.map(group => group._id === response.group._id ? response.group : group));
    });
  };

  const editPaymentsMetods = (action: string, name: string, data: string, idForDelete: string) => {
    if (!isSocketConnectedRef.current) return;
    console.log(action, name, data, idForDelete);
    socketRef.current.emit('editPaymentsMetods', {action, name, data, idForDelete}, (response: GetPaymentMetods) => {
      console.log('editPaymentsMetods:', response);
      if(!response.success) return;
      console.log(response.metods);
      setPaymentMetods(response.metods);
    });
  };

  // const socketRef = useRef<any>(null);

  // useEffect(() => {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     navigate('/');
  //     return;
  //   }
  //   const socket = createSocket(token);
  //   socketRef.current = socket
  //   socket.on('connect', () => {
  //     console.log('Connected', socket.id);
  //     setIsSocketConnected(true);
  //   });
  //   socket.on('upData', (time) => {
  //     console.log('upData:', time);
  //     console.log('isSocketConnected inside upData:', isSocketConnected);
  //     getGroups()
  //     getPamentMetods()
  //     setLastTimeUpdate(time)
  //   });
  //   socket.on('closeAccess', () => {
  //     sessionStorage.removeItem('token');
  //     navigate('/');
  //   });
  //   socket.on('connect_error', (err) => {
  //     console.error('Connection error:', err.message);
  //     // sessionStorage.removeItem('token'); !!!!!!!!!!!!!!!!!!!!!! только dev mode
  //     // navigate('/');
  //   });
  //   return () => {
  //     socket.disconnect();
  //     setIsSocketConnected(false);
  //   };
  // }, [navigate]);

  // useEffect(() => {
  //   getGroups()
  //   getPamentMetods()
  // }, [isSocketConnected])

  // const createNewGroup = (close: () => void) => {
  //   if (!socketRef.current) return;
  //   socketRef.current.emit('createNewGroup', newGroup, (response: ServerResponce) => {
  //     if(!response.success) return
  //     setNewGroup({name: '', promo: '', aliance: '', prefix: '', present: false})
  //     close()
  //     setGroups(ex => {return [response.group, ...ex]})
  //   });

  // }

  // const deleteGroup = (groupId : string) => {
  //   if (!isSocketConnected) return;
  //   socketRef.current.emit('deleteGroup', groupId, (response: {success: boolean, message: string, group: string}) => {
  //     if(!response.success) return
  //     console.log(response)
  //     setGroups(ex =>
  //       ex.filter(group =>
  //         group._id !== response.group
  //       )
  //     )
  //   });
  // }

  // const updateGroupSettings = (data: object) => {
  //   if (!isSocketConnected) return;
  //   console.log(data)
  //    socketRef.current.emit('updateGroupSettings', data, (response: GetGroup) => {
  //     if(!response.success) return
  //     console.log(response.group)
  //     setGroups(ex =>
  //       ex.map(group =>
  //         group._id === response.group._id ? response.group : group
  //       )
  //     )
  //   });
  // }

  // const getPamentMetods = () => {
  //   if (!isSocketConnected) return;
  //    socketRef.current.emit('getPaymentMetods', {}, (response: GetPaymentMetods) => {
  //     if(!response.success) return
  //     setPaymentMetods([...response.metods])
  //   });
  // }

  // const getGroups = () => {
  //   if (!isSocketConnected) return;
  //    socketRef.current.emit('getGroups', {}, (response: GetGroups) => {
  //     if(!response.success) return
  //     console.log(response.groups)
  //     setGroups([...response.groups])
  //   });
  // }

  // const editRegUsers = (idRegUsersForDeleteOrEdit: string[], groupId: string, action: string, payment: string) => {
  //   if (!isSocketConnected) return;
  //   console.log(idRegUsersForDeleteOrEdit, groupId, action);
  //   socketRef.current.emit('editRegUsers', {idRegUsersForDeleteOrEdit, groupId, action, payment}, (response: GetGroup) => {
  //     console.log('editRegUsers:', response);
  //     if(!response.success) return
  //     console.log(response.group)
  //     setGroups(ex =>
  //       ex.map(group =>
  //         group._id === response.group._id ? response.group : group
  //       )
  //     )
  //   });
  // }

  //  const editPaymentsMetods = (action: string, name: string, data: string, idForDelete: string) => {
  //   if (!isSocketConnected) return;
  //   console.log(action, name, data, idForDelete);
  //   socketRef.current.emit('editPaymentsMetods', {action, name, data, idForDelete}, (response: GetPaymentMetods) => {
  //     console.log('editPaymentsMetods:', response);
  //     if(!response.success) return
  //     console.log(response.metods)
  //     setPaymentMetods(response.metods)
  //   });
  // }

  if(sessionStorage.getItem('token')){
    return (
      <>
      <Center style={{ margin: '10px' }}>
        <MantineGroup justify="center" gap="xs">
          <Text>{formatUpdatedTime(lastTimeUpdate)}</Text>
          <Button onClick={() => {
            sessionStorage.removeItem('token')
            navigate('/')
            }}
          >
          Exit
          </Button>
          <Button variant="default" onClick={toggleTheme}>
            {colorScheme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <PaymentMetodModal paymentsMetods={paymentsMetods} editPaymentsMetods={editPaymentsMetods}/>
          <UsersModal 
          socket={socketRef.current}
          title={'Люди'}
          filter={[]}
          butColor='red'
          butDisabled={false}
          />
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
      <TableGroups
      socket={socketRef.current} 
      editRegUsers={editRegUsers} 
      paymentsMetods={paymentsMetods} 
      updateGroupSettings={updateGroupSettings}
      deleteGroup={deleteGroup}
      groups={[...filteredGroups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
      />
      </>
    );
  }
}
