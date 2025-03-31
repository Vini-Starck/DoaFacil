// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserDocumentIfNotExists(user, { cpf });
      navigate('/');
    } catch (error) {
      alert("Erro ao registrar: " + error.message);
    }
  };

  const handleGoogleRegister = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await updateProfile(user, { displayName: user.displayName });
      await createUserDocumentIfNotExists(user, { photoURL: user.photoURL });
      navigate('/');
    } catch (error) {
      alert("Erro ao registrar com Google: " + error.message);
    }
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
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      padding: "30px 20px",
      textAlign: "center",
    },
    title: {
      marginBottom: "20px",
      color: "#333",
      fontSize: "28px",
      fontWeight: "bold",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      textAlign: "left",
    },
    label: {
      fontSize: "16px",
      marginBottom: "5px",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      fontSize: "16px",
      outline: "none",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "12px",
      borderRadius: "5px",
      border: "none",
      fontSize: "16px",
      cursor: "pointer",
      transition: "opacity 0.2s",
    },
    registerButton: {
      backgroundColor: "#28a745",
      color: "#fff",
    },
    googleButton: {
      backgroundColor: "#db4437",
      color: "#fff",
    },
    hr: {
      margin: "20px 0",
      border: "none",
      borderTop: "1px solid #eee",
    },
  };

  // Efeitos de hover para os botões
  const handleHover = (e) => e.target.style.opacity = 0.8;
  const handleLeave = (e) => e.target.style.opacity = 1;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>Criar Conta</h2>
        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>Nome</label>
          <input 
            type="text" 
            placeholder="Seu nome completo" 
            value={displayName} 
            onChange={(e)=>setDisplayName(e.target.value)} 
            style={styles.input} 
          />
          <label style={styles.label}>CPF</label>
          <input 
            type="text" 
            placeholder="Seu CPF" 
            value={cpf} 
            onChange={(e)=>setCpf(e.target.value)}
            style={styles.input} 
          />
          <label style={styles.label}>Email</label>
          <input 
            type="email" 
            placeholder="Seu email" 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)}
            style={styles.input} 
          />
          <label style={styles.label}>Senha</label>
          <input 
            type="password" 
            placeholder="Digite sua senha" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)}
            style={styles.input} 
          />
          <label style={styles.label}>Confirmar Senha</label>
          <input 
            type="password" 
            placeholder="Confirme sua senha" 
            value={confirmPassword} 
            onChange={(e)=>setConfirmPassword(e.target.value)}
            style={styles.input} 
          />
          <button 
            type="submit" 
            style={{ ...styles.button, ...styles.registerButton }}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            Criar Conta
          </button>
        </form>
        <hr style={styles.hr} />
        <button 
          onClick={handleGoogleRegister} 
          style={{ ...styles.button, ...styles.googleButton }}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
        >
          Criar Conta com Google
        </button>
      </div>
    </div>
  );
};

export default Register;
