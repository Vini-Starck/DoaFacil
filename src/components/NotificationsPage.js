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
  getDoc,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import AdSense from "./AdSense"; // Importando AdSense
import defaultProfilePic from "../icons/default-profile.png"; // Imagem padrão de perfil


function RatingModal({ visible, onClose, onSubmit, targetUser }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  if (!visible) return null;
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <h3>Avalie {targetUser.displayName || targetUser.email}</h3>
        <div style={modalStyles.stars}>
          {[1,2,3,4,5].map(n => (
            <span key={n}
              style={{ fontSize: 30, cursor: 'pointer', color: n <= stars ? '#ffc107' : '#ddd' }}
              onClick={() => setStars(n)}>
              ★
            </span>
          ))}
        </div>
        <textarea
          placeholder="Comentário (opcional)"
          rows={3}
          style={modalStyles.textarea}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <button
          onClick={() => onSubmit(stars, comment)}
          style={modalStyles.submitBtn}
          disabled={stars === 0}
        >Enviar</button>
      </div>
    </div>
  );
}

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNotif, setModalNotif] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("toUser", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snapshot =>
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [currentUser]);

  // Aceita requestDonation
  const handleAcceptDonationRequest = async notif => {
    try {
      // atualiza notificação
      await updateDoc(doc(db, "notifications", notif.id), {
        status: "accepted",
        type: "donationAccepted",
      });
  
      // atualiza item de doação
      await updateDoc(doc(db, "donationItems", notif.donationId), {
        status: "em andamento",
        beneficiary: notif.fromUser,
      });
  
      // cria um novo chat entre doador e solicitante
      const chatDoc = await addDoc(collection(db, "chats"), {
        users: [currentUser.uid, notif.fromUser],
        donationId: notif.donationId,
        donationTitle: notif.donationTitle,
        createdAt: serverTimestamp(),
        messages: [],
      });
  
      const chatId = chatDoc.id;
  
      // notifica o solicitante que foi aceito e que o chat está disponível
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        toUser: notif.fromUser,
        type: "requestAccepted",
        donationId: notif.donationId,
        donationTitle: notif.donationTitle,
        chatId: chatId, // 🔥 referencia o chat criado
        message: `Sua solicitação para a doação "${notif.donationTitle}" foi aceita! Você pode conversar com o doador agora.`,
        status: "unread",
        createdAt: serverTimestamp(),
      });
  
      alert("Solicitação aceita com sucesso e chat criado!");
    } catch (err) {
      console.error("Erro ao aceitar solicitação de doação:", err);
      alert("Erro ao aceitar: " + err.message);
    }
  };
  

  // Recusa requestDonation
  const handleDeclineDonationRequest = async notif => {
    try {
      await updateDoc(doc(db, "notifications", notif.id), {
        status: "declined",
      });
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        toUser: notif.fromUser,
        type: "requestDeclined",
        donationId: notif.donationId,
        donationTitle: notif.donationTitle,
        message: `Sua solicitação para a doação "${notif.donationTitle}" foi recusada.`,
        status: "unread",
        createdAt: serverTimestamp(),
      });
      alert("Solicitação recusada.");
    } catch (err) {
      console.error("Erro ao recusar:", err);
      alert("Erro ao recusar: " + err.message);
    }
  };

  // Marca requestAccepted como visto
  const handleOk = async notifId => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { status: "seen" });
    } catch (err) {
      console.error("Erro ao marcar como visto:", err);
    }
  };

  const openEvaluate = async notif => {
      // pega dados do usuário a ser avaliado
      const userSnap = await getDoc(doc(db, "users", notif.fromUser));
      if (userSnap.exists()) setTargetUser({ id: notif.fromUser, ...userSnap.data() });
      setModalNotif(notif);
      setModalVisible(true);
    };

  const handleSubmitRating = async (stars, comment) => {
  const notif = modalNotif;
  if (!notif) return;
  const targetRef = doc(db, "users", notif.fromUser);
  const notifRef = doc(db, "notifications", notif.id);

  try {
    await runTransaction(db, async tx => {
      const userDoc = await tx.get(targetRef);
      if (!userDoc.exists()) throw new Error("Usuário não encontrado");
      const data = userDoc.data();
      const prevRating = data.rating ?? 0;
      const prevCount = data.ratingCount ?? 0;
      const newCount = prevCount + 1;
      const newRating = (prevRating * prevCount + stars) / newCount;
      tx.update(targetRef, { rating: newRating, ratingCount: newCount });
      // atualiza notificação como avaliada
      tx.update(notifRef, { status: "evaluated" });
    });

    // Cria documento na coleção "avaliations"
    await addDoc(collection(db, "avaliations"), {
      fromUser: currentUser.uid,
      toUser: notif.fromUser,
      donationId: notif.donationId,
      stars,
      comment: comment || "",
      createdAt: serverTimestamp(),
    });

    alert("Avaliação enviada!");
  } catch (err) {
    console.error(err);
    alert("Erro ao enviar avaliação: " + err.message);
  } finally {
    setModalVisible(false);
  }
};

  return (
  <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: 20 }}>
    {/* Anúncio à esquerda */}
    <div style={{ flex: "0 0 320px", display: "flex", justifyContent: "center" }}>
      <AdSense
        adSlot="4451812486"
        style={{ display: 'block', margin: '20px auto', maxWidth: '320px' }}
      />
    </div>

    {/* Notificações centralizadas */}
    <div style={{ flex: "1 1 600px", maxWidth: 600 }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Notificações</h2>
      {notifications.length === 0 && (
        <p style={{ textAlign: "center" }}>Nenhuma notificação.</p>
      )}
      {notifications.map(notif => (
        <NotificationCard
          key={notif.id}
          notif={notif}
          onAcceptDonation={handleAcceptDonationRequest}
          onDeclineDonation={handleDeclineDonationRequest}
          onOk={handleOk}
          onOpenEvaluate={openEvaluate}
        />
      ))}
      <RatingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitRating}
        targetUser={targetUser}
      />
    </div>

    {/* Anúncio à direita */}
    <div style={{ flex: "0 0 320px", display: "flex", justifyContent: "center" }}>
      <AdSense
        adSlot="4451812486"
        style={{ display: 'block', margin: '20px auto', maxWidth: '320px' }}
      />
    </div>
  </div>
);

function NotificationCard({ notif, onAcceptDonation, onDeclineDonation, onOk, onOpenEvaluate }) {
  const [donationImg, setDonationImg] = useState(null);

  // busca a imagem da doação
  useEffect(() => {
    if (!notif.donationId) return;
    getDoc(doc(db, "donationItems", notif.donationId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.imageUrl) {
          setDonationImg(
            `https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
              data.imageUrl
            )}?alt=media`
          );
        }
      }
    });
  }, [notif.donationId]);

  const cardStyle = {
    border: "1px solid #ccc",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    background: "#fff",
  };

  // requestDonation
  if (notif.type === "requestDonation") {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <Link to={`/profile/${notif.fromUser}`}>
            <img
              src={notif.fromUserPhoto || defaultProfilePic}
              alt=""
              style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
            />
          </Link>
          <div>
            <Link
              to={`/profile/${notif.fromUser}`}
              style={{ fontWeight: "bold", color: "#007bff", textDecoration: "none" }}
            >
              {notif.fromUserName}
            </Link>
            <p style={{ margin: "4px 0", color: "#666" }}>
              {notif.fromUserRating != null
                ? `Avaliação: ${notif.fromUserRating}`
                : "Sem avaliação"}
            </p>
          </div>
        </div>

        {donationImg && (
          <img
            src={donationImg}
            alt=""
            style={{
              width: "100%",
              maxHeight: 150,
              objectFit: "cover",
              borderRadius: 6,
              marginBottom: 10,
            }}
          />
        )}

        <p>
          <strong>
            <Link to="/my-donations">{notif.donationTitle}</Link>
          </strong>{" "}
          está sendo solicitado.
        </p>
        <p>Status: {notif.status}</p>
        {notif.status === "pending" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => onAcceptDonation(notif)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Aceitar
            </button>
            <button
              onClick={() => onDeclineDonation(notif)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Recusar
            </button>
          </div>
        )}
      </div>
    );
  }

  // requestAccepted (solicitante vê este)
  if (notif.type === "requestAccepted") {
    return (
      <div style={cardStyle}>
        <p>
          <strong>{notif.fromUserName}</strong> aceitou sua solicitação para{" "}
          <strong>{notif.donationTitle}</strong>. Agora vocês podem conversar!
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Link
            to={`/chat/${notif.chatId}`} // 🔥 link para a página de chat
            style={{
              padding: "8px 12px",
              backgroundColor: "#28a745",
              color: "#fff",
              borderRadius: 5,
              textDecoration: "none",
            }}
          >
            Ir para o chat
          </Link>
          {notif.status !== "seen" && (
            <button
              onClick={() => onOk(notif.id)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    );
  }

  // donationAccepted (criador vê este)
  if (notif.type === "donationAccepted") {
    return (
      <div style={cardStyle}>
        <p>
          Você aceitou a solicitação de <strong>{notif.fromUserName}</strong> para a doação {" "}
          <strong>{notif.donationTitle}</strong>.
        </p>
      </div>
    );
  }

  if (notif.type === "chatClosedEvaluate") {
    return (
      <div style={cardStyle}>
        <p>{notif.message}</p>
        {notif.status === "pending" && (
          <button
            onClick={() => onOpenEvaluate(notif)}
            style={{ padding: "8px 12px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
          >Avaliar Usuário</button>
        )}
      </div>
    );
  }

  // chatRequest e chatAccepted usam seu JSX antigo
  if (notif.type === "chatRequest") {
    return (
      <div style={cardStyle}>
        {/* … seu código JSX para chatRequest … */}
      </div>
    );
  }
  if (notif.type === "chatAccepted") {
    return (
      <div style={cardStyle}>
        {/* … seu código JSX para chatAccepted … */}
      </div>
    );
  }

  return null;
}};

const modalStyles = {
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", padding: 20, borderRadius: 8, width: 300, textAlign: "center" },
  stars: { margin: "10px 0" },
  textarea: { width: "100%", height: 60, marginBottom: 10, padding: 8, borderRadius: 4, border: "1px solid #ccc" },
  submitBtn: { padding: "8px 16px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }
};

export default NotificationsPage;
