// src/components/Profile.js
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate, useParams } from "react-router-dom";
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
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { deleteUserAndDonations } from "../utils/userUtils";

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

  // Fetch profile data including rating
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
          // fetch rating from users collection
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

  const handleContact = async () => {
    if (!currentUser) return;
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid)
    );
    const snaps = await getDocs(q);
    const existing = snaps.docs.find(d => d.data().participants.includes(uid));
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      await addDoc(collection(db, "notifications"), {
        fromUser: currentUser.uid,
        fromUserName: currentUser.displayName || currentUser.email,
        toUser: uid,
        fromUserPhoto: currentUser.photoURL || null,
        fromUserRating: rating,
        message: `Olá, gostaria de conversar com você!`,
        type: "chatRequest",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Solicitação enviada.");
    }
  };

  return (
    <div style={styles.card}>
      {userData ? (
        <>
          <div onClick={onPhotoClick} style={{ position: 'relative' }}>
            <img
              src={photoURL || '/icons/default-profile.png'}
              alt="Perfil"
              style={styles.avatar}
            />
            {isOwnProfile && (
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onPhotoChange}
                accept="image/*"
              />
            )}
          </div>
          <h2 style={styles.name}>{userData.displayName || userData.email}</h2>
          <p style={styles.email}>{userData.email}</p>
          <p style={styles.rating}>
            {rating != null ? `Avaliação: ${rating.toFixed(1)}` : 'Sem avaliação'}
          </p>

          {isOwnProfile ? (
            <div style={styles.actions}>
              {editing ? (
                <>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    style={styles.input}
                    maxLength={50}
                  />
                  <button onClick={saveProfile} style={{...styles.btn, ...styles.primary}}>
                    Salvar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  style={{...styles.btn, ...styles.secondary}}
                >
                  Editar Nome
                </button>
              )}
              <button onClick={() => navigate('/my-donations')} style={styles.btn}>
                Minhas Doações
              </button>
              <button onClick={() => navigate('/chat')} style={{...styles.btn, ...styles.primary}}>
                Chats
              </button>
              <button onClick={handleLogout} style={{...styles.btn, ...styles.danger}}>
                Sair
              </button>
              <button onClick={handleDeleteAccount} style={{...styles.btn, ...styles.danger}}>
                Excluir Conta
              </button>
            </div>
          ) : (
            <button onClick={handleContact} style={{...styles.btn, ...styles.primary}}>
              Enviar Mensagem
            </button>
          )}
        </>
      ) : (
        <p>Carregando perfil...</p>
      )}
    </div>
  );
};

const styles = {
  card: {
    maxWidth: 400,
    margin: '40px auto',
    padding: 20,
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 16,
    cursor: 'pointer',
  },
  name: {
    margin: '0 0 8px',
    fontSize: 24,
    color: '#333',
  },
  email: {
    margin: '0 0 8px',
    color: '#666',
    fontSize: 14,
  },
  rating: {
    margin: '0 0 16px',
    color: '#444',
    fontSize: 16,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 16,
  },
  input: {
    padding: 8,
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #ccc',
    width: '70%',
    margin: '0 auto',
  },
  btn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    backgroundColor: '#6c757d',
    color: '#fff',
  },
  primary: { backgroundColor: '#007bff' },
  secondary: { backgroundColor: '#28a745' },
  danger: { backgroundColor: '#dc3545' },
};

export default Profile;
