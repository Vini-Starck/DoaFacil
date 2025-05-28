// src/components/ConcludeDetailModal.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";
import defaultProfile from "../icons/default-profile.png";

// Reaproveita função de tempo relativo
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} minutos atrás`;
  const hours = Math.floor(minutes / 60000);
  if (hours < 24) return `${hours} horas atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dias atrás`;
};

const getImageUrl = (path) =>
  `https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
    path
  )}?alt=media`;

export default function ConcludeDetailModal({ donation, onClose }) {
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [beneficiary, setBeneficiary] = useState(null);
  const [creatorEval, setCreatorEval] = useState(null);
  const [beneficiaryEval, setBeneficiaryEval] = useState(null);

  useEffect(() => {
    async function fetchUser(id, setter) {
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) setter(snap.data());
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
      }
    }
    fetchUser(donation.userId, setCreator);
    if (donation.beneficiary) fetchUser(donation.beneficiary, setBeneficiary);
  }, [donation.userId, donation.beneficiary]);

  useEffect(() => {
    async function fetchEvals() {
      try {
        const q = query(
          collection(db, "avaliations"),
          where("donationId", "==", donation.id)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.fromUser === donation.userId) setCreatorEval(data);
          if (data.fromUser === donation.beneficiary) setBeneficiaryEval(data);
        });
      } catch (err) {
        console.error("Erro ao buscar avaliações:", err);
      }
    }
    if (donation.id) fetchEvals();
  }, [donation.id, donation.userId, donation.beneficiary]);

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
              src={getImageUrl(donation.imageUrl)}
              alt="Doação"
              style={styles.image}
              onError={(e) => (e.currentTarget.src = defaultProfile)}
            />
          ) : (
            <div style={styles.placeholder}>Sem imagem</div>
          )}
          <div style={styles.badges}>
            <span style={{ ...styles.badge, ...styles.statusBadge }}>{donation.status}</span>
            <span style={{ ...styles.badge, ...styles.typeBadge }}>{donation.donationType}</span>
          </div>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>{donation.description}</p>
          <p style={styles.field}>
            <strong>Concluído:</strong> {donation.concludeAt?.toDate ? getRelativeTime(donation.concludeAt.toDate()) : donation.concludeAt}
          </p>
        </div>

        {/* Doador e Beneficiário */}
        {creator && (
          <div style={styles.userSection}>
            <div style={styles.userLeft}>
              <p style={styles.userRole}>Doador</p>
              <img
                src={creator.photoURL || defaultProfile}
                alt="Doador"
                style={styles.avatar}
                onClick={() => navigate(`/profile/${donation.userId}`)}
              />
              <p style={styles.userName} onClick={() => navigate(`/profile/${donation.userId}`)}>
                {creator.displayName || creator.email}
              </p>
            </div>
            <div style={styles.userRight}>
              <p style={styles.evalTitle}>Avaliação</p>
              <p style={styles.userRating}>
                {creatorEval ? `${creatorEval.stars} ⭐ - "${creatorEval.comment}"` : "Sem avaliação"}
              </p>
            </div>
          </div>
        )}

        {beneficiary && (
          <div style={styles.userSection}>
            <div style={styles.userLeft}>
              <p style={styles.userRole}>Beneficiário</p>
              <img
                src={beneficiary.photoURL || defaultProfile}
                alt="Beneficiário"
                style={styles.avatar}
                onClick={() => navigate(`/profile/${donation.beneficiary}`)}
              />
              <p style={styles.userName} onClick={() => navigate(`/profile/${donation.beneficiary}`)}>
                {beneficiary.displayName || beneficiary.email}
              </p>
            </div>
            <div style={styles.userRight}>
              <p style={styles.evalTitle}>Avaliação</p>
              <p style={styles.userRating}>
                {beneficiaryEval ? `${beneficiaryEval.stars} ⭐ - "${beneficiaryEval.comment}"` : "Sem avaliação"}
              </p>
            </div>
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
    zIndex: 1000
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
    boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  header: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    position: "relative"
  },
  title: { fontSize: 22, color: "#28a745", fontWeight: "bold", flex: 1, textAlign: "center" },
  closeBtn: { background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#888", position: "absolute", right: 0, top: 0 },
  imageWrapper: { position: "relative", width: "100%", marginBottom: 18, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 },
  image: { width: "100%", maxWidth: 350, height: "auto", maxHeight: 260, borderRadius: 10, objectFit: "contain", background: "#fafbfc", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  placeholder: { width: "100%", minHeight: 180, background: "#f0f0f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 16 },
  badges: { position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 7, zIndex: 2 },
  badge: { padding: "4px 10px", borderRadius: 5, fontSize: 13, color: "#fff", fontWeight: "bold", textTransform: "capitalize", letterSpacing: 0.2 },
  statusBadge: { backgroundColor: "#168723" },
  typeBadge: { backgroundColor: "#007bff" },
  content: { marginBottom: 18, width: "100%", textAlign: "center" },
  description: { color: "#444", lineHeight: 1.5, marginBottom: 12, fontSize: 16, fontWeight: 500 },
  field: { marginBottom: 7, color: "#555", fontSize: 15, textAlign: "center" },
  userSection: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 18 },
  userLeft: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 },
  avatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: "2px solid #28a745" },
  userRole: { margin: 0, fontSize: 14, fontWeight: "bold" },
  userName: { margin: 0, fontSize: 16, fontWeight: "bold", cursor: "pointer", color: "#007bff" },
  userRight: { textAlign: "right" },
  evalTitle: { margin: 0, fontSize: 14, fontWeight: "bold" },
  userRating: { margin: "4px 0 0", fontSize: 14, color: "#555" }
};
