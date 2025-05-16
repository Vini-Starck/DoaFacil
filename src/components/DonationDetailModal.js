// src/components/DonationDetailModal.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";

const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} minutos atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} horas atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dias atrás`;
};

export default function DonationDetailModal({ donation, onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [creator, setCreator] = useState(null);
  const [creatorRating, setCreatorRating] = useState(null);
  const [requested, setRequested] = useState(false);

  // Carrega dados do criador
  useEffect(() => {
    async function fetchCreator() {
      try {
        const snap = await getDoc(doc(db, "users", donation.userId));
        if (snap.exists()) {
          const data = snap.data();
          setCreator(data);
          setCreatorRating(data.rating ?? null);
        }
      } catch (err) {
        console.error("Erro ao buscar criador:", err);
      }
    }
    fetchCreator();
  }, [donation.userId]);

  // Verifica se já existe solicitação para esta doação
  useEffect(() => {
    if (!currentUser) return;
    async function checkRequested() {
      try {
        const notifQuery = query(
          collection(db, "notifications"),
          where("type", "==", "requestDonation"),
          where("fromUser", "==", currentUser.uid),
          where("donationId", "==", donation.id)
        );
        const snap = await getDocs(notifQuery);
        if (!snap.empty) {
          setRequested(true);
        }
      } catch (err) {
        console.error("Erro ao verificar solicitação:", err);
      }
    }
    checkRequested();
  }, [currentUser, donation.id]);

  // Envia notificação de solicitação
  const handleRequest = async () => {
    if (!currentUser) return onClose();
    if (currentUser.uid === donation.userId) {
      alert("Você é o criador desta doação.");
      return;
    }
    try {
      // evita chats duplicados
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid)
      );
      const snap = await getDocs(q);
      const exists = snap.docs.some((d) =>
        d.data().participants.includes(donation.userId)
      );
      if (exists) {
        alert("Você já tem um chat com este usuário.");
        return;
      }

      // cria notificação
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        fromUserPhoto: currentUser.photoURL || null,
        fromUserRating: currentUser.rating || null,
        toUser: donation.userId,
        donationId: donation.id,
        donationTitle: donation.title,
        type: "requestDonation",
        message: `O usuário ${currentUser.displayName ||
          currentUser.email} deseja a sua doação "${donation.title}".`,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Solicitação enviada!");
      setRequested(true);
    } catch (err) {
      console.error("Erro ao solicitar doação:", err);
      alert("Não foi possível enviar solicitação.");
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={styles.title}>{donation.title}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </header>

        <div style={styles.imageWrapper}>
          {donation.imageUrl ? (
            <img
              src={donation.imageUrl}
              alt="Doação"
              style={styles.image}
              onError={(e) => {
                e.currentTarget.src =
                  "https://cdn-icons-png.flaticon.com/512/684/684908.png";
              }}
            />
          ) : (
            <div style={styles.placeholder}>Sem imagem</div>
          )}
          <div style={styles.badges}>
            <span style={{ ...styles.badge, ...styles.statusBadge }}>
              {donation.status}
            </span>
            <span style={{ ...styles.badge, ...styles.typeBadge }}>
              {donation.donationType}
            </span>
          </div>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>{donation.description}</p>

          {donation.location && (
            <p style={styles.field}>
              <strong>Localização:</strong> {donation.location}
            </p>
          )}

          {Object.entries(donation)
            .filter(
              ([k]) =>
                ![
                  "id",
                  "title",
                  "description",
                  "imageUrl",
                  "latitude",
                  "longitude",
                  "createdAt",
                  "status",
                  "donationType",
                  "userId",
                  "location",
                ].includes(k)
            )
            .map(([k, v]) => (
              <p key={k} style={styles.field}>
                <strong>{k}:</strong> {String(v)}
              </p>
            ))}

          {donation.createdAt?.toDate && (
            <p style={styles.timestamp}>
              Criada {getRelativeTime(donation.createdAt.toDate())}
            </p>
          )}
        </div>

        {creator && (
          <div style={styles.creator}>
            <img
              src={creator.photoURL || "/icons/default-profile.png"}
              alt="Criador"
              style={styles.avatar}
              onClick={() => navigate(`/profile/${donation.userId}`)}
            />
            <div>
              <p
                style={styles.creatorName}
                onClick={() => navigate(`/profile/${donation.userId}`)}
              >
                {creator.displayName || creator.email}
              </p>
              <p style={styles.creatorRating}>
                {creatorRating != null
                  ? `Avaliação: ${creatorRating}`
                  : "Sem avaliação"}
              </p>
            </div>
          </div>
        )}

        <button
          style={{
            ...styles.button,
            backgroundColor: requested ? "#6c757d" : "#28a745",
            cursor: requested ? "not-allowed" : "pointer",
          }}
          onClick={handleRequest}
          disabled={requested}
        >
          {requested ? "Solicitação enviada" : "Quero esta doação"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90%",
    overflowY: "auto",
    padding: 20,
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { margin: 0, fontSize: 20, color: "#333" },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    color: "#888",
  },
  imageWrapper: { position: "relative", textAlign: "center", marginBottom: 15 },
  image: { width: "100%", borderRadius: 8, maxHeight: 250, objectFit: "cover" },
  placeholder: {
    width: "100%",
    height: 250,
    background: "#f0f0f0",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
  },
  badges: {
    position: "absolute",
    top: 10,
    left: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  badge: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 12,
    color: "#fff",
  },
  statusBadge: { backgroundColor: "#168723" },
  typeBadge: { backgroundColor: "#007bff" },
  content: { marginBottom: 20 },
  description: { color: "#555", lineHeight: 1.4, marginBottom: 10 },
  field: { marginBottom: 6, color: "#444" },
  timestamp: { fontSize: 12, color: "#999", marginTop: 10 },
  creator: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
  },
  creatorName: {
    margin: 0,
    fontWeight: "bold",
    color: "#007bff",
    cursor: "pointer",
  },
  creatorRating: { margin: 0, color: "#666", fontSize: 14 },
  button: {
    width: "100%",
    padding: "12px 0",
    fontSize: 16,
    border: "none",
    borderRadius: 5,
    color: "#fff",
  },
};
