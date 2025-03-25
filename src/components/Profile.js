// src/components/Profile.js
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth, storage, db } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";

const Profile = () => {
  const { uid } = useParams(); // UID passado na rota
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Verifica se o perfil é do usuário logado
  const isOwnProfile = currentUser && uid === currentUser.uid;

  // Estado para armazenar os dados do perfil a serem exibidos
  const [userData, setUserData] = useState(null);

  // Se for perfil próprio, usamos currentUser; caso contrário, buscamos os dados no Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (isOwnProfile) {
        setUserData({
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
        });
      } else {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            console.error("Usuário não encontrado");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };
    if (uid) fetchUserData();
  }, [uid, isOwnProfile, currentUser]);

  // Estados para edição (apenas para o próprio perfil)
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || "");
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setPhotoURL(userData.photoURL || "");
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const handlePhotoClick = () => {
    if (isOwnProfile) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fileRef = ref(storage, `profileImages/${currentUser.uid}-${file.name}`);
      await uploadBytes(fileRef, file);
      const newPhotoURL = await getDownloadURL(fileRef);
      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
      await updateDoc(doc(db, "users", currentUser.uid), { photoURL: newPhotoURL });
      setPhotoURL(newPhotoURL);
    } catch (error) {
      console.error("Erro ao atualizar a foto:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName });
      await updateDoc(doc(db, "users", currentUser.uid), { displayName });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Perfil do Usuário</h2>
      {userData ? (
        <div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={photoURL || "/icons/default-profile.png"}
              alt="Foto de perfil"
              style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "10px", cursor: isOwnProfile ? "pointer" : "default", objectFit: "cover" }}
              onClick={handlePhotoClick}
            />
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                  accept="image/*"
                />
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "25px",
                    height: "25px",
                    cursor: "pointer",
                  }}
                >
                  ✎
                </button>
              </>
            )}
          </div>
          <h3>{userData.displayName || userData.email}</h3>
          {isOwnProfile && isEditing ? (
            <div style={{ marginTop: "10px" }}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Digite seu nome"
                style={{ padding: "8px", width: "200px", marginRight: "10px" }}
                maxLength={50}
              />
              <button onClick={handleSaveProfile} style={{ padding: "8px 12px", cursor: "pointer" }}>
                Salvar
              </button>
            </div>
          ) : null}
          <p><strong>Email:</strong> {userData.email}</p>
          {isOwnProfile ? (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => navigate("/my-donations")}
                style={{ padding: "10px", marginRight: "10px", cursor: "pointer" }}
              >
                Minhas Doações
              </button>
              <button
                onClick={() => navigate("/")}
                style={{ padding: "10px", marginRight: "10px", cursor: "pointer" }}
              >
                Voltar para a Lista
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: "10px", cursor: "pointer", backgroundColor: "red", color: "white" }}
              >
                Sair
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "10px" }}>
              {/* Perfil de outro usuário - exibe apenas informações públicas */}</div>
          )}
        </div>
      ) : (
        <p>Você não está logado.</p>
      )}
    </div>
  );
};

export default Profile;
