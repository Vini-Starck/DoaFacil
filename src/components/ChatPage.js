// src/components/ChatPage.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  where,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Buscar apenas os chats do usuário atual
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid), // Apenas chats em que o usuário está participando
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const chat = { id: docSnap.id, ...docSnap.data() };

          // Identifica o outro participante do chat
          const otherUserId = chat.participants.find(
            (id) => id !== currentUser.uid
          );

          if (otherUserId) {
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            if (userDoc.exists()) {
              // Adiciona o id do usuário ao objeto para possibilitar o redirecionamento
              chat.otherUser = { id: otherUserId, ...userDoc.data() };
            }
          }

          return chat;
        })
      );

      setChats(chatData);
      if (!selectedChat && chatData.length > 0) {
        setSelectedChat(chatData[0]);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Buscar mensagens do chat selecionado
  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, "chats", selectedChat.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    });

    return unsubscribe;
  }, [selectedChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !selectedChat) return;

    try {
      await addDoc(collection(db, "chats", selectedChat.id, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
      {/* Div de chats - sem alterações */}
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
        }}
      >
        <h3 style={{ padding: "10px" }}>Chats</h3>
        {chats.map((chat) => (
          <div
            key={chat.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              cursor: "pointer",
              backgroundColor:
                selectedChat && selectedChat.id === chat.id
                  ? "#f0f0f0"
                  : "transparent",
            }}
            onClick={() => setSelectedChat(chat)}
          >
            {/* Foto do outro usuário */}
            <img
              src={chat.otherUser?.photoURL || "/default-avatar.png"}
              alt="Avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                marginRight: "10px",
                objectFit: "cover"
              }}
            />
            <div>
              <strong>
                {chat.otherUser?.displayName || "Usuário"}
              </strong>
              <p style={{ fontSize: "12px", color: "#666" }}>
                {chat.lastMessage || ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Conversa */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Cabeçalho da conversa com foto e nome do usuário */}
        {selectedChat && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              borderBottom: "1px solid #ccc",
            }}
          >
            <img
              src={selectedChat.otherUser?.photoURL || "/default-avatar.png"}
              alt="Avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                objectFit: "cover"
              }}
              onClick={() =>
                navigate(`/profile/${selectedChat.otherUser?.id}`)
              }
            />
            <h3
              style={{ marginLeft: "10px", cursor: "pointer" }}
              onClick={() =>
                navigate(`/profile/${selectedChat.otherUser?.id}`)
              }
            >
              {selectedChat.otherUser?.displayName || "Usuário"}
            </h3>
          </div>
        )}

        {/* Área de mensagens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser.uid;
            return (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  flexDirection: isCurrentUser ? "row-reverse" : "row",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                {/* Foto do remetente */}
                <img
                  src={
                    isCurrentUser
                      ? currentUser.photoURL || "/default-avatar.png"
                      : selectedChat?.otherUser?.photoURL ||
                        "/default-avatar.png"
                  }
                  alt="Avatar"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    margin: "0 10px",
                    objectFit: "cover"
                  }}
                />

                {/* Mensagem */}
                <div
                  style={{
                    maxWidth: "60%",
                    padding: "10px",
                    borderRadius: "10px",
                    backgroundColor: isCurrentUser ? "#28a745" : "#f0f0f0",
                    color: isCurrentUser ? "#fff" : "#000",
                    textAlign: isCurrentUser ? "right" : "left",
                  }}
                >
                  <p style={{ margin: 0 }}>{message.text}</p>
                  <small style={{ fontSize: "10px", color: "#000" }}>
                    {message.createdAt?.toDate
                      ? message.createdAt.toDate().toLocaleString()
                      : ""}
                  </small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campo de envio de mensagem */}
        <form
          onSubmit={handleSendMessage}
          style={{
            display: "flex",
            padding: "10px",
            borderTop: "1px solid #ccc",
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 15px",
              marginLeft: "10px",
              border: "none",
              backgroundColor: "#28a745",
              color: "#fff",
              borderRadius: "5px",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
