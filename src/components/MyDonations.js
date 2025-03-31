// src/components/MyDonations.js
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

// Componente HoverButton: gerencia o estado de hover e mescla estilos
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

const MyDonations = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    // Consulta as doações onde o usuário logado é o criador
    const q = query(
      collection(db, "donationItems"),
      where("userId", "==", currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userDonations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setDonations(userDonations);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleEditDonation = (donation) => {
    navigate(`/edit-donation/${donation.id}`);
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta doação?")) return;
    try {
      await deleteDoc(doc(db, "donationItems", donationId));
      alert("Doação excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir a doação:", error);
      alert("Erro ao excluir a doação.");
    }
  };

  const handleConcludeDonation = async (donationId) => {
    if (!window.confirm("Deseja concluir esta doação?")) return;
    try {
      await updateDoc(doc(db, "donationItems", donationId), { status: "concluido" });
      alert("Doação concluída com sucesso.");
    } catch (error) {
      console.error("Erro ao concluir a doação:", error);
      alert("Erro ao concluir a doação.");
    }
  };

  // Filtra as doações em ativas e concluídas
  const activeDonations = donations.filter(
    (donation) => donation.status !== "concluido"
  );
  const concludedDonations = donations.filter(
    (donation) => donation.status === "concluido"
  );

  // Estilos
  const containerStyle = { padding: "20px" };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const cardStyle = {
    display: "flex",
    flexDirection: "column",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  };

  const donationInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    width: "100%",
    cursor: "pointer",
    marginBottom: "10px",
  };

  const imageStyle = {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid #ddd",
  };

  const detailsStyle = { flex: 1 };

  const titleStyle = {
    margin: "0 0 5px",
    fontSize: "18px",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const descriptionStyle = { margin: "0 0 10px", color: "#666" };

  const buttonGroupStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  };

  // Botões - estilos base
  const baseButtonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const editButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
  };

  const deleteButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#dc3545",
    color: "#fff",
  };

  const concludeButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: "#28a745",
    color: "#fff",
  };

  // Botões - estilos de hover com borda extra
  const editButtonHover = {
    backgroundColor: "#0056b3",
    
  };

  const deleteButtonHover = {
    backgroundColor: "#b02a37",
    
  };

  const concludeButtonHover = {
    backgroundColor: "#1e7e34",
    
  };

  return (
    <section style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Minhas Doações Ativas</h2>
      {activeDonations.length ? (
        <div style={gridStyle}>
          {activeDonations.map((donation) => {
            const isHovered = hoveredId === donation.id;
            return (
              <div
                key={donation.id}
                style={{
                  ...cardStyle,
                  boxShadow: isHovered
                    ? "0 6px 12px rgba(0, 0, 0, 0.2)"
                    : "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredId(donation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Container para informações (imagem + texto) */}
                <div
                  style={donationInfoStyle}
                  onClick={() => handleEditDonation(donation)}
                >
                  {donation.imageUrl && (
                    <img
                      src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                        donation.imageUrl
                      )}?alt=media`}
                      alt="Imagem do item"
                      style={imageStyle}
                    />
                  )}
                  <div style={detailsStyle}>
                    <h2 style={titleStyle} title={donation.title}>
                      {donation.title}
                    </h2>
                    <p style={descriptionStyle}>{donation.description}</p>
                  </div>
                </div>
                {/* Botões de ação para doações ativas */}
                <div style={buttonGroupStyle}>
                  <HoverButton
                    baseStyle={editButtonStyle}
                    hoverStyle={editButtonHover}
                    onClick={() => handleEditDonation(donation)}
                  >
                    Editar
                  </HoverButton>
                  <HoverButton
                    baseStyle={deleteButtonStyle}
                    hoverStyle={deleteButtonHover}
                    onClick={() => handleDeleteDonation(donation.id)}
                  >
                    Excluir
                  </HoverButton>
                  <HoverButton
                    baseStyle={concludeButtonStyle}
                    hoverStyle={concludeButtonHover}
                    onClick={() => handleConcludeDonation(donation.id)}
                  >
                    Concluir
                  </HoverButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>
          Nenhuma doação ativa encontrada.
        </p>
      )}

      {/* Seção de doações concluídas */}
      <h2 style={{ textAlign: "center", margin: "40px 0 20px" }}>Doações Concluídas</h2>
      {concludedDonations.length ? (
        <div style={gridStyle}>
          {concludedDonations.map((donation) => (
            <div
              key={donation.id}
              style={{
                ...cardStyle,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                cursor: "default",
              }}
            >
              <div style={donationInfoStyle}>
                {donation.imageUrl && (
                  <img
                    src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                      donation.imageUrl
                    )}?alt=media`}
                    alt="Imagem do item"
                    style={imageStyle}
                  />
                )}
                <div style={detailsStyle}>
                  <h2 style={titleStyle} title={donation.title}>
                    {donation.title}
                  </h2>
                  <p style={descriptionStyle}>{donation.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>
          Nenhuma doação concluída encontrada.
        </p>
      )}
    </section>
  );
};

export default MyDonations;
