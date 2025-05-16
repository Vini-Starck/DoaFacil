// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';
import AdSense from './AdSense';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocumentIfNotExists(user);
      navigate('/');
    } catch (error) {
      alert("Erro ao logar: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await createUserDocumentIfNotExists(user);
      navigate('/');
    } catch (error) {
      alert("Erro ao logar com Google: " + error.message);
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
    loginButton: {
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

  // Funções para efeito hover
  const handleHover = (e) => e.target.style.opacity = 0.8;
  const handleLeave = (e) => e.target.style.opacity = 1;

  return (
    <div style={styles.page}>

    {/* AdSense acima do formulário */}
        <div style={{ marginBottom: 24 }}>
          <AdSense
            adSlot="4451812486"
            style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
          />
        </div>
      <div style={styles.container}>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            style={styles.input}
          />
          <button
            type="submit"
            style={{ ...styles.button, ...styles.loginButton }}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            Logar
          </button>
        </form>
        <hr style={styles.hr} />
        <button
          onClick={handleGoogleLogin}
          style={{ ...styles.button, ...styles.googleButton }}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
        >
          Logar com Google
        </button>

      </div>
        {/* AdSense abaixo do formulário */}
      <div style={{ marginTop: 24 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
    </div>
  );
};

export default Login;
