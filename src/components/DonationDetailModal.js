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
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import defaultProfile from "../icons/default-profile.png";

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

export default function DonationDetailModal({ donation, onClose, onReport, onRequestSuccess }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [creator, setCreator] = useState(null);
  const [creatorRating, setCreatorRating] = useState(null);
  const [requested, setRequested] = useState(false);
  const [reported, setReported] = useState(false);

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

  useEffect(() => {
    async function checkReported() {
      if (!currentUser) return;
      try {
        const reportRef = doc(db, "users", currentUser.uid, "hiddenDonations", donation.id);
        const snap = await getDoc(reportRef);
        if (snap.exists()) setReported(true);
      } catch (err) {
        setReported(false);
      }
    }
    checkReported();
  }, [currentUser, donation.id]);

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

  const handleRequest = async () => {
    if (!currentUser) {
      alert("Você precisa estar logado para solicitar a doação.");
      return;
    }

    if (currentUser.uid === donation.userId) {
      alert("Você é o criador desta doação.");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Usuário não encontrado.");
        return;
      }

      const userData = userSnap.data();
      const requestsLeft = userData.requestsLeft || 0;

      if (requestsLeft <= 0) {
        alert("Você atingiu o limite de solicitações de doação.");
        return;
      }

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser.uid)
      );
      const snap = await getDocs(q);
      const exists = snap.docs.some((d) => d.data().participants.includes(donation.userId));

      if (exists) {
        alert("Você já tem um chat com este usuário.");
        return;
      }

      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        fromUserPhoto: currentUser.photoURL || null,
        fromUserRating: currentUser.rating || null,
        toUser: donation.userId,
        donationId: donation.id,
        donationTitle: donation.title,
        type: "requestDonation",
        message: `O usuário ${currentUser.displayName || currentUser.email} deseja a sua doação "${donation.title}".`,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await updateDoc(userRef, {
        requestsLeft: increment(-1),
      });

      alert("Solicitação enviada!");
      setRequested(true);
      if (onRequestSuccess) {
        onRequestSuccess();
      }

    } catch (err) {
      console.error("Erro ao solicitar doação:", err);
      alert("Não foi possível enviar solicitação.");
    }
  };

  const handleReport = async () => {
    if (!currentUser) return;
    try {
      await setDoc(
        doc(db, "users", currentUser.uid, "hiddenDonations", donation.id),
        {
          reportedAt: serverTimestamp(),
          donationId: donation.id,
        },
        { merge: true }
      );

      const donationRef = doc(db, "donationItems", donation.id);
      await updateDoc(donationRef, {
        reportCount: increment(1),
      });

      setReported(true);
      onReport && onReport(donation.id);
      alert("Doação denunciada e ocultada para você.");
      onClose();
    } catch (err) {
      console.error("Erro ao denunciar doação:", err);
      alert("Erro ao denunciar a doação. Tente novamente.");
    }
  };

  const renderDistance = () => {
    if (donation.distance !== undefined && donation.distance !== Infinity) {
      return (
        <span style={styles.distance}>
          {Number(donation.distance).toFixed(2)} km de distância
        </span>
      );
    }
    return null;
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={styles.title}>{donation.title}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar modal">×</button>
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
          {renderDistance()}
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
                  "distance",
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
              src={creator.photoURL || defaultProfile}
              alt="Criador"
              style={styles.avatar}
              onClick={() => navigate(`/profile/${donation.userId}`)}
            />
            <div style={styles.creatorInfo}>
              <p
                style={styles.creatorName}
                onClick={() => navigate(`/profile/${donation.userId}`)}
              >
                {creator.displayName || creator.email}
              </p>
              <p style={styles.creatorRating}>
                {creatorRating != null
                  ? `Avaliação: ${Number(creatorRating).toFixed(2)}`
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

        {!reported ? (
          <button
            style={{
              ...styles.button,
              backgroundColor: "#dc3545",
              marginTop: 16,
            }}
            onClick={handleReport}
          >
            Denunciar e ocultar esta doação
          </button>
        ) : (
          <div style={{ color: "#dc3545", marginTop: 16, textAlign: "center" }}>
            Você já denunciou esta doação.
          </div>
        )}
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
    borderRadius: 12,
    width: "95%",
    maxWidth: 480,
    maxHeight: "92vh",
    overflowY: "auto",
    padding: 24,
    position: "relative",
    boxShadow: "0 8px 32px rgba(40,167,69,0.13)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    position: "relative",
  },
  title: {
    margin: 0,
    fontSize: 22,
    color: "#28a745",
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 28,
    cursor: "pointer",
    color: "#888",
    position: "absolute",
    right: 0,
    top: 0,
    lineHeight: 1,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: 18,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 180,
  },
  image: {
    width: "100%",
    maxWidth: 350,
    height: "auto",
    maxHeight: 260,
    borderRadius: 10,
    objectFit: "contain",
    background: "#fafbfc",
    boxShadow: "0 2px 12px rgba(40,167,69,0.08)",
  },
  placeholder: {
    width: "100%",
    minHeight: 180,
    background: "#f0f0f0",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: 16,
  },
  badges: {
    position: "absolute",
    top: 12,
    left: 12,
    display: "flex",
    flexDirection: "column",
    gap: 7,
    zIndex: 2,
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 5,
    fontSize: 13,
    color: "#fff",
    fontWeight: "bold",
    boxShadow: "0 1px 4px rgba(40,167,69,0.10)",
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
  statusBadge: { backgroundColor: "#168723" },
  typeBadge: { backgroundColor: "#007bff" },
  content: {
    marginBottom: 18,
    width: "100%",
    textAlign: "center",
  },
  description: {
    color: "#444",
    lineHeight: 1.5,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: 500,
  },
  field: {
    marginBottom: 7,
    color: "#555",
    fontSize: 15,
    textAlign: "center",
  },
  timestamp: {
    fontSize: 13,
    color: "#999",
    marginTop: 10,
    textAlign: "center",
  },
  distance: {
    display: "block",
    color: "#007bff",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  creator: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
    width: "100%",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    border: "2px solid #28a745",
    marginBottom: 4,
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
  },
  creatorInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  creatorName: {
    margin: 0,
    fontWeight: "bold",
    color: "#007bff",
    cursor: "pointer",
    fontSize: 16,
    textAlign: "center",
    wordBreak: "break-word",
  },
  creatorRating: {
    margin: 0,
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    width: "100%",
    padding: "14px 0",
    fontSize: 17,
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 2,
    transition: "background 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
  },
};