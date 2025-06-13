import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';
import logo from "../icons/logo.png";
import logoText from "../icons/logoEscrito.png";

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
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "13px",
      textAlign: "left",
    },
    label: {
      fontSize: "15px",
      marginBottom: "3px",
      color: "#444",
      fontWeight: 500,
    },
    input: {
      width: "100%",
      padding: "11px",
      borderRadius: "6px",
      border: "1.5px solid #e0e0e0",
      fontSize: "15px",
      outline: "none",
      boxSizing: "border-box",
      background: "#fafbfc",
      transition: "border 0.2s",
      marginBottom: 2,
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
    },
    loginButton: {
      background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)",
      color: "#fff",
      letterSpacing: 0.5,
      boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
    },
    googleButton: {
      backgroundColor: "#fff",
      color: "#222",
      border: "1.5px solid #db4437",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 0,
      boxShadow: "0 2px 8px rgba(219,68,55,0.08)",
    },
    googleIcon: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "#fff",
      border: "2px solid #111",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
    },
    hr: {
      margin: "22px 0 16px 0",
      border: "none",
      borderTop: "1px solid #eee",
    },
    bottomText: {
      marginTop: 18,
      color: "#666",
      fontSize: 15,
      textAlign: "center",
    },
    link: {
      marginLeft: 6,
      color: "#007bff",
      textDecoration: "underline",
      fontWeight: "bold",
      cursor: "pointer",
      fontSize: 15,
    },
    logoTextImg: {
      height: 30,   // ou ajuste conforme o tamanho ideal
      marginLeft: 8, 
      resizeMode: 'contain'
    }
  };

  // Efeitos de hover para os botões
  const handleHover = (e) => e.target.style.opacity = 0.85;
  const handleLeave = (e) => e.target.style.opacity = 1;

  return (
    <div style={styles.page}>
      
      <div style={styles.container}>
        {/* Logo e nome do app */}
        <div style={styles.logoBox}>
          <img src={logo} alt="Logo DoaFácil" style={styles.logoImg} />
          <img src={logoText} alt="Texto DoaFácil" style={styles.logoTextImg} />
        </div>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
            autoComplete="username"
          />
          <label style={styles.label}>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            style={{ ...styles.button, ...styles.loginButton }}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
          >
            Entrar
          </button>
        </form>
        <hr style={styles.hr} />
        <button
          onClick={handleGoogleLogin}
          style={{ ...styles.button, ...styles.googleButton }}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={styles.googleIcon}
          />
          Entrar com Google
        </button>
        <div style={styles.bottomText}>
          Não tem conta?
          <a href="/register" style={styles.link}>Cadastre-se</a>
        </div>
      </div>
      
    </div>
  );
};

export default Login;