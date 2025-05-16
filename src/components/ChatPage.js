// src/components/ChatPage.js
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  where,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const ChatPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { chatId: routeChatId } = useParams();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // redireciona se não logado
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // busca lista de chats — só aqueles com closed !== true
  useEffect(() => {
  if (!currentUser) return;
  const q = query(
    collection(db, "chats"),
    where("users", "array-contains", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  const unsub = onSnapshot(q, async (snap) => {
    const loaded = await Promise.all(
      snap.docs
        .filter(
          (d) => d.data().closed === false || d.data().closed === undefined
        )
        .map(async (d) => {
          const data = d.data();
          const otherId = data.users.find((id) => id !== currentUser.uid);
          let otherUser = null;
          if (otherId) {
            const userSnap = await getDoc(doc(db, "users", otherId));
            if (userSnap.exists())
              otherUser = { id: otherId, ...userSnap.data() };
          }
          return {
            id: d.id,
            donationTitle: data.donationTitle,
            users: data.users,
            otherUser,
            lastMessageAt: data.lastMessageAt,
          };
        })
    );
    setChats(loaded);
    const byRoute = loaded.find((c) => c.id === routeChatId);
    setSelectedChat(byRoute || loaded[0] || null);
  });
  return unsub;
}, [currentUser, routeChatId]);

  // carrega mensagens do chat selecionado
  useEffect(() => {
    if (!selectedChat) return;
    const q = query(
      collection(db, "chats", selectedChat.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return unsub;
  }, [selectedChat]);

  // scroll automático só quando chega nova mensagem
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // envio de mensagem
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    const chatRef = doc(db, "chats", selectedChat.id);
    try {
      await addDoc(collection(db, "chats", selectedChat.id, "messages"), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(chatRef, { lastMessageAt: serverTimestamp() });
      setNewMessage("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  // muda chat ativo e atualiza URL
  const selectChat = (chat) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat.id}`, { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarHeader}>Conversas</h3>
        {chats.map((chat) => {
          const isActive = selectedChat?.id === chat.id;
          return (
            <div
              key={chat.id}
              onClick={() => selectChat(chat)}
              style={{
                ...styles.chatItem,
                backgroundColor: isActive ? "#e6f0ff" : "transparent",
              }}
            >
              <img
                src={chat.otherUser?.photoURL || "/default-avatar.png"}
                alt="Avatar"
                style={styles.avatar}
              />
              <div style={styles.chatInfo}>
                <strong style={styles.chatName}>
                  {chat.otherUser?.displayName || "Usuário"}
                </strong>
                <div style={styles.chatSub}>
                  sobre: <em>{chat.donationTitle}</em>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Painel de Chat */}
      <div style={styles.chatArea}>
        {selectedChat ? (
          <>
            <div style={styles.chatHeader}>
              <img
                src={selectedChat.otherUser?.photoURL || "/default-avatar.png"}
                alt="Avatar"
                style={styles.avatarLarge}
                onClick={() =>
                  navigate(`/profile/${selectedChat.otherUser.id}`)
                }
              />
              <div>
                <h3
                  style={styles.chatNameHeader}
                  onClick={() =>
                    navigate(`/profile/${selectedChat.otherUser.id}`)
                  }
                >
                  {selectedChat.otherUser?.displayName || "Usuário"}
                </h3>
                <p style={styles.chatItemHeader}>
                  Conversa sobre: <strong>{selectedChat.donationTitle}</strong>
                </p>
              </div>
            </div>

            <div style={styles.messagesWrapper}>
              {messages.map((msg) => {
                const me = msg.senderId === currentUser.uid;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: me ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      marginBottom: 12,
                    }}
                  >
                    <img
                      src={
                        me
                          ? currentUser.photoURL || "/default-avatar.png"
                          : selectedChat.otherUser.photoURL ||
                            "/default-avatar.png"
                      }
                      alt="Avatar"
                      style={styles.avatarSmall}
                    />
                    <div
                      style={{
                        ...styles.bubble,
                        backgroundColor: me ? "#34a853" : "#f1f3f4",
                        color: me ? "#fff" : "#202124",
                      }}
                    >
                      <p style={{ margin: 0 }}>{msg.text}</p>
                      <small style={styles.timestamp}>
                        {msg.createdAt?.toDate
                          ? msg.createdAt.toDate().toLocaleTimeString()
                          : ""}
                      </small>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form style={styles.inputForm} onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={styles.inputBox}
              />
              <button type="submit" style={styles.sendButton}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={styles.emptyState}>
            Selecione uma conversa à esquerda.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

// ===== Estilos =====
const styles = {
  container: {
    display: "flex",
    height: "calc(100vh - 120px)",
  },
  sidebar: {
    width: "28%",
    borderRight: "1px solid #ddd",
    overflowY: "auto",
    background: "#fff",
  },
  sidebarHeader: {
    padding: "12px",
    margin: 0,
    borderBottom: "1px solid #eee",
    background: "#f9f9f9",
    fontSize: 18,
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    marginRight: 12,
    objectFit: "cover",
  },
  chatInfo: { flex: 1 },
  chatName: { margin: 0, fontSize: 15 },
  chatSub: { fontSize: 12, color: "#666" },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#f1f3f4",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: "1px solid #ddd",
    background: "#fff",
    gap: 12,
  },
  avatarLarge: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    cursor: "pointer",
    objectFit: "cover",
  },
  chatNameHeader: {
    margin: 0,
    fontSize: 18,
    color: "#1a73e8",
    cursor: "pointer",
  },
  chatItemHeader: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "#555",
  },
  messagesWrapper: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    margin: "12px",
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "inset 0 0 8px rgba(0,0,0,0.04)",
    maxHeight: "60vh",
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    margin: "0 8px",
    objectFit: "cover",
  },
  bubble: {
    maxWidth: "65%",
    padding: "10px 16px",
    borderRadius: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    fontSize: 14,
  },
  timestamp: {
    display: "block",
    marginTop: 6,
    fontSize: 10,
    color: "#666",
    textAlign: "right",
  },
  inputForm: {
    display: "flex",
    padding: "12px 20px",
    borderTop: "1px solid #ddd",
    background: "#fff",
  },
  inputBox: {
    flex: 1,
    padding: "10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    padding: "10px 16px",
    border: "none",
    backgroundColor: "#1a73e8",
    color: "#fff",
    fontSize: 14,
    borderRadius: 6,
    cursor: "pointer",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    fontSize: 16,
  },
};
