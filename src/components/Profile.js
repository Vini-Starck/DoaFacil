import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth, storage, db } from "../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import ConcludeDetailModal from "./ConcludeDetailModal";
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
  const [avaliations, setAvaliations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const fileInputRef = useRef(null);

  // States para modal de detalhes concluídos
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

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

        // Carrega avaliações recebidas
        const q = query(
          collection(db, "avaliations"),
          where("toUser", "==", uid)
        );
        const snapA = await getDocs(q);
        const list = snapA.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const withUsers = await Promise.all(
          list.map(async av => {
            const userSnap = await getDoc(doc(db, "users", av.fromUser));
            const userInfo = userSnap.exists() ? userSnap.data() : {};
            return {
              ...av,
              fromUserName: userInfo.displayName || userInfo.email || 'Usuário',
              fromUserPhoto: userInfo.photoURL || defaultProfilePic
            };
          })
        );
        setAvaliations(withUsers);
      } catch (err) {
        console.error("Erro ao carregar perfil ou avaliações:", err);
      }
    };
    fetchData();
  }, [uid, isOwnProfile, currentUser]);

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

  // Handler para abrir modal de doação concluída
  const handleOpenConclude = async (donationId) => {
    try {
      const snap = await getDoc(doc(db, "donationItems", donationId));
      if (snap.exists()) {
        setSelectedDonation({ id: snap.id, ...snap.data() });
        setShowConcludeModal(true);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da doação:", err);
    }
  };

  const handleHover = e => e.target.style.opacity = 0.85;
  const handleLeave = e => e.target.style.opacity = 1;

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 24 }}>
        <AdSense adSlot="4451812486" style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }} />
      </div>

      <div style={styles.container}>
        <div style={styles.logoBox}>
          <img src={logo} alt="Logo DoaFácil" style={styles.logoImg} />
          <img src={logoText} alt="Texto DoaFácil" style={styles.logoTextImg} />
        </div>
        <h2 style={styles.title}>Perfil</h2>

        {userData ? (
          <>
            <div onClick={onPhotoClick} style={styles.avatarBox}>
              <img src={photoURL || defaultProfilePic} alt="Perfil" style={styles.avatar} />
              {isOwnProfile && (
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={onPhotoChange}
                  accept="image/*"
                />
              )}
              {isOwnProfile && <span style={styles.editPhotoHint}>Clique na foto para alterar</span>}
            </div>

            <div style={styles.profileInfo}>
              {editing ? (
                <>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    style={styles.input}
                    maxLength={50}
                  />
                  <button onClick={saveProfile} style={{ ...styles.button, ...styles.primary }} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                    Salvar
                  </button>
                </>
              ) : (
                <h3 style={styles.name}>{userData.displayName || userData.email}</h3>
              )}
              <p style={styles.email}>{userData.email}</p>
              <p style={styles.rating}>{rating != null ? `Avaliação: ${rating.toFixed(1)}` : 'Sem avaliação'}</p>
            </div>

            {isOwnProfile && !editing && (
              <button onClick={() => setEditing(true)} style={{ ...styles.button, ...styles.secondary }} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                Editar Nome
              </button>
            )}

            {isOwnProfile && (
              <div style={styles.actions}>
                <button onClick={() => navigate('/my-donations')} style={styles.button} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                  Minhas Doações
                </button>
                <button onClick={() => navigate('/chat')} style={{ ...styles.button, ...styles.primary }} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                  Chats
                </button>
                <button onClick={handleLogout} style={{ ...styles.button, ...styles.danger }} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                  Sair
                </button>
                <button onClick={handleDeleteAccount} style={{ ...styles.button, ...styles.danger }} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                  Excluir Conta
                </button>
              </div>
            )}
          </>
        ) : (
          <p>Carregando perfil...</p>
        )}
      </div>

      {/* Avaliações em grid: clicar abre modal de conclusão */}
      {avaliations.length > 0 && (
        <div style={styles.reviewWrapper}>
          <h3 style={styles.reviewTitle}>Avaliações Recebidas</h3>
          <div style={styles.reviewGrid}>
            {avaliations.map(av => (
              <div
                key={av.id}
                style={{ ...styles.reviewCard, cursor: 'pointer' }}
                onClick={() => handleOpenConclude(av.donationId)}
              >
                <Link to={`/profile/${av.fromUser}`} style={styles.reviewerLink}>
                  <img src={av.fromUserPhoto} alt={av.fromUserName} style={styles.reviewerAvatar} />
                  <span style={styles.reviewerName}>{av.fromUserName}</span>
                </Link>
                <p style={styles.comment}><strong>Comentário:</strong> {av.comment}</p>
                <p style={styles.stars}><strong>Estrelas:</strong> {av.stars} ⭐</p>
                <p style={styles.date}>{new Date(av.createdAt.toDate()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de detalhes da doação concluída */}
      {showConcludeModal && selectedDonation && (
        <ConcludeDetailModal
          donation={selectedDonation}
          onClose={() => setShowConcludeModal(false)}
        />
      )}

      <div style={{ marginTop: 24 }}>
        <AdSense adSlot="4451812486" style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }} />
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "linear-gradient(135deg, #28a745, #007bff)",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  container: {
    width: '400px',
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(40, 167, 69, 0.10), 0 1.5px 8px rgba(0,0,0,0.08)",
    padding: "36px 24px 28px 24px",
    textAlign: "center",
    marginBottom: 24
  },
  logoBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 18,
  },
  logoImg: { width: 64, height: 64, marginBottom: 6, boxShadow: "0 2px 12px rgba(40,167,69,0.10)", borderRadius: 16, background: "#fff" },
  logoTextImg: { height: 30, marginLeft: 8 },
  title: { marginBottom: "18px", color: "#222", fontSize: "24px", fontWeight: "bold", letterSpacing: 0.5 },
  avatarBox: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center" },
  avatar: { width: 120, height: 120, borderRadius: "50%", objectFit: "cover", marginBottom: 8, cursor: "pointer", border: "3px solid #28a745", boxShadow: "0 2px 8px rgba(40,167,69,0.10)", background: "#fafbfc" },
  editPhotoHint: { fontSize: 12, color: "#888", marginTop: 2, marginBottom: 8 },
  profileInfo: { marginBottom: 10 },
  name: { margin: "10px 0 4px", fontSize: 22, color: "#333", fontWeight: "bold", letterSpacing: 0.5 },
  email: { margin: "0 0 8px", color: "#666", fontSize: 14 },
  rating: { margin: "0 0 16px", color: "#444", fontSize: 16 },
  actions: { display: "flex", flexDirection: "column", gap: 10, marginTop: 16 },
  input: { padding: 10, fontSize: 16, borderRadius: 6, border: "1.5px solid #e0e0e0", width: "100%", marginBottom: 8, background: "#fafbfc", boxSizing: "border-box", outline: "none", transition: "border 0.2s" },
  button: { width: "100%", padding: "13px", borderRadius: "6px", border: "none", fontSize: "16px", cursor: "pointer", transition: "opacity 0.2s, box-shadow 0.2s", fontWeight: "bold", marginTop: 6, boxShadow: "0 2px 8px rgba(40,167,69,0.08)", background: "#6c757d", color: "#fff" },
  primary: { background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)", color: "#fff" },
  secondary: { backgroundColor: "#28a745", color: "#fff" },
  danger: { backgroundColor: "#dc3545", color: "#fff" },
  reviewWrapper: { width: '100%', maxWidth: '1200px', marginBottom: 24 },
  reviewTitle: { fontSize: 20, color: 'black', marginBottom: 16, textAlign: 'left' },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(30%, 1fr))', gap: '16px' },
  reviewCard: { background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  reviewerLink: { display: 'flex', alignItems: 'center', textDecoration: 'none', marginBottom: 8 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 8 },
  reviewerName: { fontWeight: 'bold', color: '#007bff' },
  comment: { margin: '4px 0' },
  stars: { margin: '4px 0' },
  date: { fontSize: 12, color: '#666' }
};

export default Profile;
