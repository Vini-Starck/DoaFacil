// src/components/ContactProfilePage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../AuthContext";

const ContactProfilePage = () => {
  const { userId } = useParams(); // Usuário criador da doação
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [activeDonations, setActiveDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Buscar dados do usuário criador
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.error("Usuário não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
    };
    fetchUserData();
  }, [userId]);

  // Buscar doações ativas do usuário criador
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const donationsRef = collection(db, "donationItems");
        const q = query(donationsRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const donationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveDonations(donationsData);
        if (donationsData.length > 0) {
          setSelectedDonationId(donationsData[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar doações:", error);
      }
    };
    fetchDonations();
  }, [userId]);

  // Verifica se já existe um chat entre currentUser e o usuário criador
  const checkExistingChat = async () => {
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const existingChats = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      return data.participants.includes(userId);
    });
    return existingChats.length > 0 ? existingChats[0].id : null;
  };

  // Função para enviar mensagem (cria notificação de chatRequest)
  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Por favor, digite sua mensagem.");
      return;
    }
    if (!selectedDonationId) {
      alert("Por favor, selecione a doação sobre a qual deseja entrar em contato.");
      return;
    }
    try {
      // Verifica se já existe um chat entre os usuários
      const existingChatId = await checkExistingChat();
      if (existingChatId) {
        alert(
          `Você já possui um chat com ${userData.displayName || userData.email}.`
        );
        navigate(`/chat/${existingChatId}`);
        return;
      }
      
      const selectedDonation = activeDonations.find(
        (d) => d.id === selectedDonationId
      );
      if (!selectedDonation) {
        alert("Doação selecionada não encontrada.");
        return;
      }
  
      // Cria a notificação de solicitação de chat (chatRequest)
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        toUser: userId,
        donationId: selectedDonationId,
        donationTitle: selectedDonation.title,
        message: message.trim(),
        type: "chatRequest",
        status: "pending",
        createdAt: serverTimestamp(),
      });
  
      alert(
        `Uma solicitação de conversa foi criada para "${selectedDonation.title}" e você poderá mandar mensagens para ${
          userData.displayName || userData.email
        } assim que ele aceitar.`
      );
  
      navigate("/chat");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem.");
    }
  };

  return userData ? (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <img
        src={userData.photoURL || "/icons/default-profile.png"}
        alt="Foto de perfil"
        style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover" }}
      />
      <h2>{userData.displayName || userData.email}</h2>
      <p>{activeDonations.length} doações realizadas</p>
      {activeDonations.length > 0 && (
        <div style={{ marginTop: "15px", textAlign: "left" }}>
          <h4>Selecione a doação para contato:</h4>
          <select
            value={selectedDonationId}
            onChange={(e) => setSelectedDonationId(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            {activeDonations.map((donation) => (
              <option key={donation.id} value={donation.id}>
                {donation.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div style={{ marginTop: "20px" }}>
        <textarea
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button
          onClick={handleSendMessage}
          style={{ marginTop: "10px", padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Mandar Mensagem
        </button>
      </div>
    </div>
  ) : (
    <p>Carregando perfil...</p>
  );
};

export default ContactProfilePage;
