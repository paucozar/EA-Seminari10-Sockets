// src/components/Chat/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import "./Chat.css";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { User } from "../../types/types";

interface ChatMessage {
  room: string;
  author: string;
  message: string;
  time: string;
}

const Chat: React.FC = () => {
  const location = useLocation();
  const user = location.state?.user as User; // Accede al usuario pasado por navigate
  const [room, setRoom] = useState("sala1");
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    socketRef.current = io("http://localhost:3001", {
      auth: {
        token,
      },
    });

    socketRef.current.on("receive_message", (data: ChatMessage) => {
      console.log("Mensaje recibido:", data);
      setMessageList((prev) => [...prev, data]);
    });

    socketRef.current.on("status", (data) => {
      console.debug("Estado recibido:", data);
      if (data.status === "unauthorized") {
        window.location.href = "/";
      }
    });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("register_user", user.name);
    });

    // Escuchar cuando un usuario se une a la sala
    socketRef.current.on("user_joined", (data) => {
      alert(`Un nuevo usuario se ha unido a la sala: ${data.username}`);
    });

    // Escuchar cuando un usuario se conecta al servidor
    socketRef.current.on("user_connected", (data) => {
      alert(data.message); // O muestra el mensaje donde quieras
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messageList]);

  const joinRoom = () => {
    if (room) {
      socketRef.current?.emit("join_room", {
        roomId: room,
        username: user.name,
      });
      setShowChat(true);
    }
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData: ChatMessage = {
        room,
        author: user.name,
        message: currentMessage,
        time: new Date().toLocaleTimeString(),
      };

      await socketRef.current?.emit("send_message", messageData);
      setMessageList((prev) => [...prev, messageData]);
      setCurrentMessage("");
    }
  };

  return (
    <div className="chat-container">
      {!showChat ? (
        <div className="join-chat">
          <h2>Bienvenid@ al Chat {user.name}</h2>
          <input
            type="text"
            placeholder="Sala..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Unirse a la Sala</button>
        </div>
      ) : (
        <div className="chat-box">
          <div className="chat-header">Sala: {room}</div>
          <div className="chat-body" ref={chatBodyRef}>
            {messageList.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.author === user.name ? "own" : "other"
                }`}
              >
                <div className="bubble">
                  <p>{msg.message}</p>
                  <div className="meta">
                    <span>{msg.author}</span>
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-footer">
            <input
              type="text"
              placeholder="Mensaje..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
