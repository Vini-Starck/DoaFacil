import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth, storage, db } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { deleteUserAndDonations } from "../utils/userUtils";
import AdSense from './AdSense';
import logo from "../icons/logo.png";
import logoText from "../icons/logoEscrito.png";
import defaultProfilePic from "../icons/default-profile.png";

const Profile = () => {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnProfile = currentUser && uid === currentUser.uid;

  const [userData, setUserData] = useState(null);
  const [rating, setRating] = useState(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const fileInputRef = useRef(null);

  // Carrega dados do perfil e avaliação
  useEffect(() => {
    const fetchData = async () => {
      try {
        let data = {};
        if (isOwnProfile) {
          data = {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          };
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          setRating(snap.exists() ? snap.data().rating || null : null);
        } else {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) {
            data = snap.data();
            setRating(snap.data().rating || null);
          }
        }
        setUserData(data);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      }
    };
    fetchData();
  }, [uid, isOwnProfile, currentUser]);

  // Sincroniza campos de edição
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setPhotoURL(userData.photoURL || "");
    }
  }, [userData]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const onPhotoClick = () => {
    if (isOwnProfile) fileInputRef.current.click();
  };

  const onPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `profileImages/${currentUser.uid}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      await updateDoc(doc(db, "users", currentUser.uid), { photoURL: url });
      setPhotoURL(url);
    } catch (err) {
      console.error("Erro ao atualizar foto:", err);
    }
  };

  const saveProfile = async () => {
    if (!displayName.trim()) return;
    try {
      await updateProfile(auth.currentUser, { displayName });
      await updateDoc(doc(db, "users", currentUser.uid), { displayName });
      setEditing(false);
      setUserData({ ...userData, displayName });
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Tem certeza que deseja apagar sua conta e todos os seus dados?")) {
      try {
        await deleteUserAndDonations(currentUser.uid, auth, navigate);
      } catch (err) {
        console.error("Erro ao excluir conta:", err);
        alert("Não foi possível excluir a conta.");
      }
    }
  };

  // Efeitos de hover para os botões
  const handleHover = (e) => e.target.style.opacity = 0.85;
  const handleLeave = (e) => e.target.style.opacity = 1;

  return (
    <div style={styles.page}>
      {/* AdSense acima do cartão */}
      <div style={{ marginBottom: 24 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
      <div style={styles.container}>
        {/* Logo e nome do app */}
        <div style={styles.logoBox}>
          <img src={logo} alt="Logo DoaFácil" style={styles.logoImg} />
          <img src={logoText} alt="Texto DoaFácil" style={styles.logoTextImg} />
        </div>
        <h2 style={styles.title}>Perfil</h2>
        {userData ? (
          <>
            <div onClick={onPhotoClick} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src={photoURL || defaultProfilePic}
                alt="Perfil"
                style={styles.avatar}
              />
              {isOwnProfile && (
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={onPhotoChange}
                  accept="image/*"
                />
              )}
              {isOwnProfile && (
                <span style={styles.editPhotoHint}>Clique na foto para alterar</span>
              )}
            </div>
            <div style={styles.profileInfo}>
              {editing ? (
                <>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={styles.input}
                    maxLength={50}
                  />
                  <button
                    onClick={saveProfile}
                    style={{ ...styles.button, ...styles.primary }}
                    onMouseEnter={handleHover}
                    onMouseLeave={handleLeave}
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <h3 style={styles.name}>{userData.displayName || userData.email}</h3>
              )}
              <p style={styles.email}>{userData.email}</p>
              <p style={styles.rating}>
                {rating != null ? `Avaliação: ${rating.toFixed(1)}` : "Sem avaliação"}
              </p>
            </div>
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ ...styles.button, ...styles.secondary }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                Editar Nome
              </button>
            )}
            <div style={styles.actions}>
              <button
                onClick={() => navigate("/my-donations")}
                style={styles.button}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                Minhas Doações
              </button>
              <button
                onClick={() => navigate("/chat")}
                style={{ ...styles.button, ...styles.primary }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                Chats
              </button>
              <button
                onClick={handleLogout}
                style={{ ...styles.button, ...styles.danger }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                Sair
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{ ...styles.button, ...styles.danger }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                Excluir Conta
              </button>
            </div>
          </>
        ) : (
          <p>Carregando perfil...</p>
        )}
      </div>
      {/* AdSense abaixo do cartão */}
      <div style={{ marginTop: 24 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "linear-gradient(135deg, #28a745, #007bff)",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "400px",
    width: "100%",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(40, 167, 69, 0.10), 0 1.5px 8px rgba(0,0,0,0.08)",
    padding: "36px 24px 28px 24px",
    textAlign: "center",
    position: "relative",
  },
  logoBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 18,
  },
  logoImg: {
    width: 64,
    height: 64,
    marginBottom: 6,
    boxShadow: "0 2px 12px rgba(40,167,69,0.10)",
    borderRadius: 16,
    background: "#fff"
  },
  appName: {
    fontWeight: "bold",
    fontSize: 28,
    color: "#28a745",
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    marginBottom: "18px",
    color: "#222",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: 8,
    cursor: "pointer",
    border: "3px solid #28a745",
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
    background: "#fafbfc"
  },
  editPhotoHint: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    marginBottom: 8,
  },
  profileInfo: {
    marginBottom: 10,
  },
  name: {
    margin: "10px 0 4px",
    fontSize: 22,
    color: "#333",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  email: {
    margin: "0 0 8px",
    color: "#666",
    fontSize: 14,
  },
  rating: {
    margin: "0 0 16px",
    color: "#444",
    fontSize: 16,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 16,
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderRadius: 6,
    border: "1.5px solid #e0e0e0",
    width: "100%",
    marginBottom: 8,
    background: "#fafbfc",
    boxSizing: "border-box",
    outline: "none",
    transition: "border 0.2s",
  },
  button: {
    width: "100%",
    padding: "13px",
    borderRadius: "6px",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    transition: "opacity 0.2s, box-shadow 0.2s",
    fontWeight: "bold",
    marginTop: 6,
    boxShadow: "0 2px 8px rgba(40,167,69,0.08)",
    background: "#6c757d",
    color: "#fff",
  },
  primary: { background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)", color: "#fff" },
  secondary: { backgroundColor: "#28a745", color: "#fff" },
  danger: { backgroundColor: "#dc3545", color: "#fff" },
  logoTextImg: {
    height: 30,   // ou ajuste conforme o tamanho ideal
    marginLeft: 8, 
    resizeMode: 'contain'
  }
};

export default Profile;