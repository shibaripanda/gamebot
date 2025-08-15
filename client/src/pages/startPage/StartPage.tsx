import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { ColorSchemeToggle } from "../../components/colorSchemeToggle/ColorSchemeToggle";
import { TitleWelcom } from "../../components/title/TitleWelcom";

export function StartPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<string>('CLOSE')
  const navigate = useNavigate();

  useEffect(() => {
    if(token){
      auth()
    }
    else if(sessionStorage.getItem('token')){
      setStatus('GAMEBOT')
      navigate('/dashboard')
    }
    else{
      setStatus('CLOSE')
    }
  }, [])

  const auth = async () => {
    await axios.get(`${import.meta.env.VITE_WEB_URL}/access/${token}`)
    .then((res) => {
      sessionStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    })
    .catch(() => {
      sessionStorage.removeItem('token');
      navigate('/')
    })
  }

  return (
    <>
      <TitleWelcom title={status}/>
      <ColorSchemeToggle/>
    </>
  );
}
