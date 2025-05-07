// src/components/DonationDetailModal.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";

// — Fix Leaflet’s missing-default-icon problem in CRA —
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Utility: compute relative time
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

  // Load creator info + rating
  useEffect(() => {
    async function fetchCreator() {
      try {
        const refUser = doc(db, "users", donation.userId);
        const snap = await getDoc(refUser);
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

  // Send request notification
  const handleRequest = async () => {
    if (!currentUser) return onClose();
    try {
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
      onClose();
    } catch (err) {
      console.error("Erro ao solicitar doação:", err);
      alert("Não foi possível enviar solicitação.");
    }
  };

  const darkLayer =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h1 style={styles.title}>{donation.title}</h1>
          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <section style={styles.main}>
          <div style={styles.imageContainer}>
            {donation.imageUrl ? (
              <img
                src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                  donation.imageUrl
                )}?alt=media`}
                alt="Doação"
                style={styles.image}
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
          <div style={styles.details}>
            <p style={styles.description}>{donation.description}</p>
            {/* Location (render once, not in the extras loop) */}
            {donation.location && (
              <div style={styles.row}>
                <strong style={styles.rowLabel}>Localização:</strong> {donation.location}
              </div>
            )}

            {/* Any other custom fields (excluding userId & location) */}
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
                    "userId",       // ✱ exclude the raw userId
                    "location",     // ✱ exclude location here
                  ].includes(k)
              )
              .map(([k, v]) => (
                <div key={k} style={styles.row}>
                 <strong style={styles.rowLabel}>{k}:</strong> {v}
               </div>
             ))}
            {donation.createdAt?.toDate && (
              <p style={styles.timestamp}>
                Criada {getRelativeTime(donation.createdAt.toDate())}
              </p>
            )}
          </div>
        </section>

        {donation.latitude && donation.longitude && (
          <div style={styles.mapWrapper}>
            <MapContainer
              center={[donation.latitude, donation.longitude]}
              zoom={15}
              style={styles.map}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url={darkLayer}
              />
              <Marker position={[donation.latitude, donation.longitude]} />
            </MapContainer>
          </div>
        )}

        {creator && (
          <footer style={styles.creatorSection}>
            <img
              src={creator.photoURL || "/icons/default-profile.png"}
              alt="Criador"
              style={styles.creatorAvatar}
              onClick={() => navigate(`/profile/${donation.userId}`)}
            />
            <div>
              <h3
                style={styles.creatorName}
                onClick={() => navigate(`/profile/${donation.userId}`)}
              >
                {creator.displayName || creator.email}
              </h3>
              <p style={styles.creatorRating}>
                {creatorRating != null
                  ? `Avaliação: ${creatorRating}`
                  : "Sem avaliação"}
              </p>
            </div>
          </footer>
        )}

        <button style={styles.actionBtn} onClick={handleRequest}>
          Quero esta doação
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    width: "90%",
    maxWidth: 600,
    maxHeight: "90%",
    overflowY: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    position: "relative",
    padding: 20,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: 10,
  },
  title: { margin: 0, fontSize: 24, color: "#333" },
  closeBtn: {
    fontSize: 24,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#888",
  },
  main: { display: "flex", gap: 20, marginTop: 15 },
  imageContainer: { flex: 1, position: "relative" },
  image: {
    width: "100%",
    borderRadius: 8,
    objectFit: "cover",
    maxHeight: 250,
  },
  placeholder: {
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
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
  statusBadge: { backgroundColor: "#dc3545" },
  typeBadge: { backgroundColor: "#007bff" },
  details: { flex: 2 },
  description: { color: "#555", marginBottom: 10, lineHeight: 1.5 },
  row: { marginBottom: 6 },
  rowLabel: { fontWeight: "bold", color: "#444" },
  timestamp: { fontSize: 12, color: "#999", marginTop: 10 },
  mapWrapper: { marginTop: 20, borderRadius: 8, overflow: "hidden" },
  map: { height: 200, width: "100%" },
  creatorSection: {
    display: "flex",
    alignItems: "center",
    gap: 15,
    borderTop: "1px solid #eee",
    marginTop: 20,
    paddingTop: 15,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    cursor: "pointer",
    objectFit: "cover",
  },
  creatorName: {
    margin: 0,
    fontSize: 18,
    color: "#007bff",
    cursor: "pointer",
  },
  creatorRating: { fontSize: 14, color: "#666", margin: 0 },
  actionBtn: {
    marginTop: 20,
    padding: "12px 0",
    backgroundColor: "#28a745",
    color: "#fff",
    fontSize: 16,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
