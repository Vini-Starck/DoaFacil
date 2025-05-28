// src/components/MyDonations.js
import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import ConcludeDetailModal from "./ConcludeDetailModal";

// HoverButton permanece inalterado
const HoverButton = ({ baseStyle, hoverStyle, onClick, children }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...baseStyle, ...(hover ? hoverStyle : {}) }}
    >
      {children}
    </button>
  );
};

const getImageUrl = (path) =>
  `https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
    path
  )}?alt=media`;

const MyDonations = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "donationItems"), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDonations(
        items.filter(
          (d) => d.userId === currentUser.uid || d.beneficiary === currentUser.uid
        )
      );
    });
    return unsub;
  }, [currentUser]);

  const handleEdit = (d) => navigate(`/edit-donation/${d.id}`);
  const handleDelete = async (id) => {
    if (!window.confirm("Excluir esta doação?")) return;
    try {
      await deleteDoc(doc(db, "donationItems", id));
      alert("Doação excluída.");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir.");
    }
  };

  const concludeDonation = async (donation) => {
    if (!window.confirm("Deseja concluir esta doação?")) return;
    try {
      // Atualiza status da doação
      await updateDoc(doc(db, "donationItems", donation.id), {
        status: "concluido",
        concludedAt: serverTimestamp(),
      });

      // Fecha chat
      const chatQ = query(
        collection(db, "chats"),
        where("donationId", "==", donation.id)
      );
      const chatSnap = await getDocs(chatQ);
      let chatId = null;
      if (!chatSnap.empty) {
        const chatDoc = chatSnap.docs[0];
        chatId = chatDoc.id;
        await updateDoc(chatDoc.ref, {
          closed: true,
          closedAt: serverTimestamp(),
        });
      }

      // Envia notificações
      const donorId = donation.userId;
      const beneficiaryId = donation.beneficiary;
      // Beneficiário avalia doador
      await addDoc(collection(db, "notifications"), {
        toUser: beneficiaryId,
        fromUser: donorId,
        donationId: donation.id,
        chatId,
        type: "chatClosedEvaluate",
        message: `A doação "${donation.title}" foi concluída e o chat foi encerrado. Avalie quem doou para você!`,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      // Doador avalia beneficiário
      await addDoc(collection(db, "notifications"), {
        toUser: donorId,
        fromUser: beneficiaryId,
        donationId: donation.id,
        chatId,
        type: "chatClosedEvaluate",
        message: `A doação "${donation.title}" foi concluída e o chat foi encerrado. Avalie quem você beneficiou!`,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Doação concluída e solicitações de avaliação enviadas.");
    } catch (e) {
      console.error(e);
      alert("Erro ao concluir a doação.");
    }
  };

  const ownActive = donations.filter(
    (d) =>
      d.userId === currentUser.uid &&
      !["em andamento", "concluido"].includes(d.status)
  );
  const inProgress = donations.filter((d) => d.status === "em andamento");
  const concluded = donations.filter((d) => d.status === "concluido");

  const styles = {
    container: { padding: 20 },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
      gap: 20,
      margin: "0 auto",
      maxWidth: 1200,
    },
    cardBase: {
      display: "flex",
      flexDirection: "column",
      padding: 15,
      borderRadius: 12,
      backgroundColor: "#fff",
      transition: "transform .2s, box-shadow .2s",
    },
    infoStyle: { display: "flex", alignItems: "center", gap: 15, marginBottom: 10 },
    imgStyle: { width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "2px solid #ddd" },
    details: { flex: 1 },
    title: {
      margin: "0 0 5px",
      fontSize: 18,
      color: "#333",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    desc: { margin: "0 0 10px", color: "#666" },
    btnGroup: { display: "flex", gap: 10, justifyContent: "center" },
    baseBtn: { padding: "8px 12px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14 },
    editBtn: { backgroundColor: "#007bff", color: "#fff" },
    delBtn: { backgroundColor: "#dc3545", color: "#fff" },
    conclBtn: { backgroundColor: "#28a745", color: "#fff" },
    receiveBtn: { backgroundColor: "#17a2b8", color: "#fff" },
    hoverConcl: { backgroundColor: "#1e7e34" },
    hoverReceive: { backgroundColor: "#117a8b" },
  };

  return (
    <section style={styles.container}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Minhas Doações Ativas</h2>
      {ownActive.length ? (
        <div style={styles.grid}>
          {ownActive.map((d) => (
            <div
              key={d.id}
              style={{
                ...styles.cardBase,
                boxShadow:
                  hoveredId === d.id
                    ? "0 6px 12px rgba(0,0,0,.2)"
                    : "0 4px 8px rgba(0,0,0,.1)",
                transform: hoveredId === d.id ? "scale(1.02)" : "scale(1)",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={styles.infoStyle} onClick={() => handleEdit(d)}>
                {d.imageUrl && (
                  <img
                    src={getImageUrl(d.imageUrl)}
                    alt="Doação"
                    style={styles.imgStyle}
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://cdn-icons-png.flaticon.com/512/684/684908.png")
                    }
                  />
                )}
                <div style={styles.details}>
                  <h3 style={styles.title} title={d.title}>
                    {d.title}
                  </h3>
                  <p style={styles.desc}>{d.description}</p>
                </div>
              </div>
              <div style={styles.btnGroup}>
                <HoverButton
                  baseStyle={{ ...styles.baseBtn, ...styles.editBtn }}
                  hoverStyle={styles.hoverConcl}
                  onClick={() => handleEdit(d)}
                >
                  Editar
                </HoverButton>
                <HoverButton
                  baseStyle={{ ...styles.baseBtn, ...styles.delBtn }}
                  hoverStyle={styles.hoverConcl}
                  onClick={() => handleDelete(d.id)}
                >
                  Excluir
                </HoverButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação ativa.</p>
      )}

      <h2 style={{ textAlign: "center", margin: "40px 0 20px" }}>Doações Em Andamento</h2>
      {inProgress.length ? (
        <div style={styles.grid}>
          {inProgress.map((d) => {
            const amOwner = d.userId === currentUser.uid;
            return (
              <div
                key={d.id}
                style={{
                  ...styles.cardBase,
                  boxShadow:
                    hoveredId === d.id
                      ? "0 6px 12px rgba(0,0,0,.2)"
                      : "0 4px 8px rgba(0,0,0,.1)",
                  transform: hoveredId === d.id ? "scale(1.02)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={styles.infoStyle}>
                  {d.imageUrl && (
                    <img
                      src={getImageUrl(d.imageUrl)}
                      alt="Doação"
                      style={styles.imgStyle}
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://cdn-icons-png.flaticon.com/512/684/684908.png")
                      }
                    />
                  )}
                  <div style={styles.details}>
                    <h3 style={styles.title} title={d.title}>
                      {d.title}
                    </h3>
                    <p style={styles.desc}>{d.description}</p>
                    <p style={{ fontStyle: "italic", color: "#888" }}>
                      {amOwner
                        ? "Você está doando em andamento"
                        : "Você é beneficiário"}
                    </p>
                  </div>
                </div>
                <div style={styles.btnGroup}>
                  {amOwner ? (
                    <HoverButton
                      baseStyle={{ ...styles.baseBtn, ...styles.conclBtn }}
                      hoverStyle={styles.hoverConcl}
                      onClick={() => concludeDonation(d)}
                    >
                      Concluir
                    </HoverButton>
                  ) : (
                    <HoverButton
                      baseStyle={{ ...styles.baseBtn, ...styles.receiveBtn }}
                      hoverStyle={styles.hoverReceive}
                      onClick={() => concludeDonation(d)}
                    >
                      Recebi a doação
                    </HoverButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação em andamento.</p>
      )}

      <h2 style={{ textAlign: "center", margin: "40px 0 20px" }}>Doações Concluídas</h2>
      {concluded.length ? (
        <div style={styles.grid}>
          {concluded.map((d) => (
            <div
                key={d.id}
                style={{ ...styles.cardBase, boxShadow: "0 4px 8px rgba(0,0,0,.1)", cursor: "pointer" }}
                onClick={() => {
                  setSelectedDonation(d);
                  setShowConcludeModal(true);
                }}
              >
              <div style={styles.infoStyle}>
                {d.imageUrl && (
                  <img
                    src={getImageUrl(d.imageUrl)}
                    alt="Doação"
                    style={styles.imgStyle}
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://cdn-icons-png.flaticon.com/512/684/684908.png")
                    }
                  />
                )}
                <div style={styles.details}>
                  <h3 style={styles.title} title={d.title}>
                    {d.title}
                  </h3>
                  <p style={styles.desc}>{d.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação concluída.</p>
      )}

      {showConcludeModal && selectedDonation && (
          <ConcludeDetailModal
            donation={selectedDonation}
            onClose={() => setShowConcludeModal(false)}
          />
      )}
    </section>
  );
};

export default MyDonations;
