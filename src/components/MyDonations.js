// src/components/MyDonations.js
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const MyDonations = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Consulta as doações onde o usuário logado é o criador (supondo que exista o campo userId)
    const q = query(
      collection(db, "donationItems"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userDonations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDonations(userDonations);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleEditDonation = (donation) => {
    // Navega para a página de edição passando o id da doação
    navigate(`/edit-donation/${donation.id}`);
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta doação?")) return;
    try {
      await deleteDoc(doc(db, "donations", donationId));
      alert("Doação excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir a doação:", error);
      alert("Erro ao excluir a doação.");
    }
  };

  // Estilos
  const containerStyle = {
    padding: "20px",
  };

  const gridStyle = {
    display: "grid",
    gap: "20px",
    padding: "20px",
  };

  const cardStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    maxWidth: "600px",
    margin: "auto",
    cursor: "pointer",
  };

  const donationInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    width: "100%",
    cursor: "pointer",
  };

  const imageStyle = {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "2px solid #ddd",
  };

  const detailsStyle = {
    flex: 1,
  };

  const titleStyle = {
    margin: "0 0 5px",
    fontSize: "18px",
    color: "#333",
  };

  const descriptionStyle = {
    margin: "0 0 10px",
    color: "#666",
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  };

  const buttonStyle = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#dc3545",
    color: "#fff",
  };

  return (
    <section style={containerStyle}>
      {donations.length ? (
        <div style={gridStyle}>
          {donations.map((donation) => (
            <div key={donation.id} style={cardStyle}>
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
                  <h2 style={titleStyle}>{donation.title}</h2>
                  <p style={descriptionStyle}>{donation.description}</p>
                </div>
              </div>
              <div style={buttonGroupStyle}>
                <button
                  onClick={() => handleEditDonation(donation)}
                  style={editButtonStyle}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteDonation(donation.id)}
                  style={deleteButtonStyle}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>
          Nenhuma doação encontrada.
        </p>
      )}
    </section>
  );
};

export default MyDonations;
