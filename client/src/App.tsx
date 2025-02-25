import axios from 'axios';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const server_url = "http://localhost:5000";

//create socket
const socket = io(server_url, {
  auth: {
    token: localStorage.getItem("token")
  },
  // transports: ['pulling'],
  // withCredentials: true,
})

interface Message {
  username: string;
  time: string;
  content: string;
}

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [isJoin, setIsJoin] = useState(false);

  const [room, setRoom] = useState("");
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [msgs, setMsgs] = useState<Message[]>([]);

  useEffect(() => {
    socket.on('history', (data) => {
      setMsgs(data);
    })
    socket.on('receive', (data) => {
      setMsgs((prev) => [...prev, data]);
    })
  }, [])

  const handleLogin = () => {
    const data = { username }

    axios.post(`${server_url}/login`, data)
      .then(res => {
        alert(`${res.data.username} is loginned successfully.`);

        localStorage.setItem("token", res.data.token);

        socket.auth = {
          token: res.data.token
        }

        console.log(socket);

        socket.connect();

        setIsLogin(true);
      }).catch((err) => {
        alert(err.response.data.error);
      })
  }

  const handleJoin = () => {
    if (room && username) {
      socket.emit('join', room);
      setIsJoin(true);
    }
  }

  const handleSend = () => {
    if (content) {
      const data = {
        room, content
      }
      socket.emit('send', data);
      setContent("");
    }
  }

  return (
    <div>
      {
        !isLogin && <div>
          <input onChange={(e) => setUsername(e.target.value)} value={username} placeholder='Enter your username' />
          <button onClick={handleLogin}>Login</button>
        </div>
      }
      {
        isLogin && !isJoin && <div>
          <input onChange={(e) => setRoom(e.target.value)} value={room} placeholder='Enter the room name' />
          <button onClick={handleJoin}>Join</button>
        </div>
      }
      {
        isLogin && isJoin && <div>
          <input onChange={(e) => setContent(e.target.value)} value={content} placeholder="Message here ..." />
          <button onClick={handleSend}>Send</button>
          <hr />
          {
            msgs.map((item, index) => <div>
              <div>{`From ${item.username} : ${item.time}`}</div>
              <div>{item.content}</div>
            </div>)
          }
        </div>
      }
    </div>
  );
}

export default App;
