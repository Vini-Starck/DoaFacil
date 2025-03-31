// src/components/MapDonationDetailModal.js
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext"; // Se precisar do currentUser

// Função para calcular o tempo relativo (ex: "2 horas atrás")
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} segundos atrás`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutos atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} horas atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dias atrás`;
};

const MapDonationDetailModal = ({ donation, onClose }) => {
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState(null);
  const { currentUser } = useAuth(); // Obtém o usuário logado

  // Buscar os dados do criador da doação
  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const docRef = doc(db, "users", donation.userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCreatorData(docSnap.data());
        } else {
          console.error("Usuário criador não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do criador:", error);
      }
    };
    fetchCreator();
  }, [donation.userId]);

  // Função para checar se o usuário atual já possui chat com o doador
  const handleContactClick = async () => {
    try {
      // Impede que o doador tente contatar a si mesmo
      if (currentUser?.uid === donation.userId) {
        alert("Você é o criador desta doação.");
        return;
      }

      // Consulta todos os chats em que o usuário atual participa
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser?.uid)
      );
      const snapshot = await getDocs(q);

      // Verifica se já existe um chat cujo array de participants inclua o doador
      const chatExists = snapshot.docs.some((docSnap) => {
        const participants = docSnap.data().participants || [];
        return participants.includes(donation.userId);
      });

      if (chatExists) {
        // Se já existir chat, exibe mensagem
        alert("Você já tem um chat com este usuário.");
      } else {
        // Se não existir, segue para a página de contato
        navigate(`/contact/${donation.userId}/${donation.id}`);
        onClose();
      }
    } catch (error) {
      console.error("Erro ao verificar chat existente:", error);
      alert("Ocorreu um erro ao verificar o chat.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90%",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>

        <h2 style={{ textAlign: "center", marginBottom: "10px", color: "#333" }}>
          {donation.title}
        </h2>
        <p style={{ textAlign: "center", color: "#666" }}>{donation.description}</p>

        {donation.imageUrl && (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <img
              src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                donation.imageUrl
              )}?alt=media`}
              alt="Imagem da doação"
              style={{
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Campos adicionais */}
        <div>
          {Object.keys(donation)
            .filter((key) =>
              ![
                "title",
                "description",
                "userId",
                "imageUrl",
                "location",
                "latitude",
                "longitude",
                "createdAt",
                "id",
              ].includes(key)
            )
            .map((key) => (
              <p key={key} style={{ color: "#555" }}>
                <strong>{key}:</strong> {donation[key]}
              </p>
            ))}
        </div>

        {/* Tempo de criação */}
        {donation.createdAt && donation.createdAt.toDate && (
          <p style={{ textAlign: "center", color: "#999", fontSize: "12px" }}>
            Criada {getRelativeTime(donation.createdAt.toDate())}
          </p>
        )}

        {/* Informações do criador */}
        {creatorData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <img
              src={creatorData.photoURL || "/icons/default-profile.png"}
              alt="Criador"
              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
            />
            <span style={{ fontWeight: "bold", color: "#333" }}>
              {creatorData.displayName || creatorData.email}
            </span>
          </div>
        )}

        {/* Botão de entrar em contato */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleContactClick}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Entrar em Contato
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapDonationDetailModal;
