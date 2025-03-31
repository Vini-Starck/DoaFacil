// src/components/NotificationsPage.js
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Notificações carregadas:", notifs);
      setNotifications(notifs);
    });

    return unsubscribe;
  }, [currentUser]);

  const createChat = async (fromUser, toUser) => {
    if (!fromUser || !toUser) return null;
    const chatRef = collection(db, "chats");

    const chatDoc = await addDoc(chatRef, {
      participants: [fromUser, toUser],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      status: "accepted",
    });

    return chatDoc.id;
  };

  const handleAccept = async (notif) => {
    if (!notif || !notif.fromUser || !notif.donationTitle) {
      console.error("Notificação inválida", notif);
      return;
    }

    try {
      const { fromUser, donationTitle } = notif;

      // Atualiza o status da notificação para "accepted"
      await updateDoc(doc(db, "notifications", notif.id), { status: "accepted" });

      // Cria o chat entre os dois usuários
      const chatId = await createChat(fromUser, currentUser?.uid);

      if (chatId) {
        // Adiciona a primeira mensagem ao chat com o conteúdo da notificação
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderId: fromUser,
          text: notif.message,
          createdAt: serverTimestamp(),
        });

        // Envia uma nova notificação para o solicitante informando que o chat foi aceito
        await addDoc(collection(db, "notifications"), {
          fromUser: currentUser?.uid,
          fromUserName: currentUser?.displayName || currentUser?.email,
          toUser: fromUser,
          type: "chatAccepted",
          chatId,
          donationTitle,
          message: `O usuário ${currentUser?.displayName || currentUser?.email} aceitou seu contato. Agora pode mandar mensagens para falar sobre "${donationTitle}".`,
          status: "unread",
          createdAt: serverTimestamp(),
        });

        alert("Solicitação aceita. Chat criado!");
      } else {
        alert("Erro ao criar chat.");
      }
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      alert("Erro ao aceitar solicitação.");
    }
  };

  const handleDecline = async (notifId) => {
    if (!notifId) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), { status: "declined" });
      alert("Solicitação recusada.");
    } catch (error) {
      console.error("Erro ao recusar solicitação:", error);
    }
  };

  // Função para atualizar a notificação para "accepted" quando o usuário clicar no botão OK
  const handleOk = async (notifId) => {
    if (!notifId) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), { status: "accepted" });
      alert("Notificação atualizada.");
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
    }
  };

  // Estilos
  const containerStyle = {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  };

  const cardStyle = {
    border: "1px solid #ccc",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    background: "#fff",
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "10px",
  };

  const buttonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const acceptButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "#fff",
  };

  const declineButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
    color: "#fff",
  };

  const okButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "#fff",
  };

  const notificationTextStyle = {
    margin: "0 0 5px 0",
    fontSize: "16px",
    lineHeight: "1.4",
  };

  const statusTextStyle = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Notificações</h2>
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <div key={notif.id} style={cardStyle}>
            {notif.type === "chatRequest" && (
              <>
                <p style={notificationTextStyle}>
                  <strong>{notif.fromUserName || "Alguém"}</strong> deseja entrar em contato para falar sobre{" "}
                  <strong>{notif.donationTitle || "uma doação"}</strong>.
                </p>
                <p style={statusTextStyle}>Status: {notif.status}</p>
                {notif.status === "pending" && (
                  <div style={buttonGroupStyle}>
                    <button onClick={() => handleAccept(notif)} style={acceptButtonStyle}>
                      Aceitar
                    </button>
                    <button onClick={() => handleDecline(notif.id)} style={declineButtonStyle}>
                      Recusar
                    </button>
                  </div>
                )}
              </>
            )}

            {notif.type === "chatAccepted" && (
              <>
                <p style={notificationTextStyle}>
                  <strong>{notif.fromUserName || "Alguém"}</strong> aceitou sua solicitação de contato para falar sobre{" "}
                  <strong>{notif.donationTitle || "uma doação"}</strong>.
                </p>
                {/* Renderiza o botão OK apenas se o status não for "accepted" */}
                {notif.status !== "accepted" && (
                  <div style={buttonGroupStyle}>
                    <button onClick={() => handleOk(notif.id)} style={okButtonStyle}>
                      OK
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      ) : (
        <p style={{ textAlign: "center" }}>Nenhuma notificação encontrada.</p>
      )}
    </div>
  );
};

export default NotificationsPage;
