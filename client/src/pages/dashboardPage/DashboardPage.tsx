import { Button, Center, Space } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../../utils/socket";
import { CreateNewGroupModal } from "../../components/createNewGroup/CreateNewGroup";
import { NewGroup } from "./interfaces/newGroup";
import { ServerResponce } from "./interfaces/serverResponce";

export function DashboardPage() {
  const navigate = useNavigate();
  const [newGroup, setNewGroup] = useState<NewGroup>({name: '', promo: '', aliance: ''})

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
    });
    socket.on('message', (msg) => {
      console.log('Message:', msg);
    });
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      sessionStorage.removeItem('token');
      navigate('/');
    });
    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const createNewGroup = (close: () => void) => {
    if (!socketRef.current) return;
    console.log(newGroup)
    socketRef.current.emit('createNewGroup', newGroup, (response: ServerResponce) => {
      console.log('Group creation response:', response);
      if(!response.success) return
      setNewGroup({name: '', promo: '', aliance: ''})
      close()
    });

  }

  if(sessionStorage.getItem('token')){
    return (
      <>
      <CreateNewGroupModal newGroup={newGroup} setNewGroup={setNewGroup} createNewGroup={createNewGroup}/>
        <Center>
          Dashboard
          <Space/>
          <Button onClick={() => {
            sessionStorage.removeItem('token')
            navigate('/')
          }}>
            Exit
          </Button>
        </Center>
      </>
    );
  }
}
