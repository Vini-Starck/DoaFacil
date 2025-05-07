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
} from "firebase/firestore";
import { Link } from "react-router-dom";
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
      // atualiza doação
      await updateDoc(doc(db, "donationItems", notif.donationId), {
        status: "em andamento",
        beneficiary: notif.fromUser,
      });
      // notifica solicitante
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        toUser: notif.fromUser,
        type: "requestAccepted",
        donationId: notif.donationId,
        donationTitle: notif.donationTitle,
        message: `Sua solicitação para "${notif.donationTitle}" foi aceita! Confira em Minhas Doações.`,
        status: "unread",
        createdAt: serverTimestamp(),
      });
      alert("Solicitação aceita com sucesso!");
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
        message: `Sua solicitação para "${notif.donationTitle}" foi recusada.`,
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

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
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
        />
      ))}
    </div>
  );
};

function NotificationCard({ notif, onAcceptDonation, onDeclineDonation, onOk }) {
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
              src={notif.fromUserPhoto || "/icons/default-profile.png"}
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
          <strong>{notif.donationTitle}</strong>. Veja em{" "}
          <Link to="/my-donations">Minhas Doações</Link>.
        </p>
        {notif.status !== "seen" && (
          <button
            onClick={() => onOk(notif.id)}
            style={{
              marginTop: 10,
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
    );
  }

  // donationAccepted (criador vê este)
  if (notif.type === "donationAccepted") {
    return (
      <div style={cardStyle}>
        <p>
          Você aceitou a solicitação de <strong>{notif.fromUserName}</strong> para{" "}
          <strong>{notif.donationTitle}</strong>.
        </p>
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
}

export default NotificationsPage;
