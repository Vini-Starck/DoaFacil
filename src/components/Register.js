import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';
import AdSense from './AdSense';
import logo from '../icons/logo.png';
import logoText from '../icons/logoEscrito.png';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert('Você precisa aceitar os Termos de Uso para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserDocumentIfNotExists(user, {
        acceptedTerms: true,
        termsAcceptedAt: new Date(),
      });
      navigate('/');
    } catch (error) {
      alert('Erro ao registrar: ' + error.message);
    }
  };

  const handleGoogleRegister = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await updateProfile(user, { displayName: user.displayName });
      await createUserDocumentIfNotExists(user, {
        photoURL: user.photoURL,
        acceptedTerms: true,
        termsAcceptedAt: new Date(),
      });
      navigate('/');
    } catch (error) {
      alert('Erro ao registrar com Google: ' + error.message);
    }
  };

  const styles = {
    page: {
      background: 'linear-gradient(135deg, #28a745, #007bff)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    container: {
      maxWidth: '400px',
      width: '100%',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(40, 167, 69, 0.10), 0 1.5px 8px rgba(0,0,0,0.08)',
      padding: '36px 24px 28px 24px',
      textAlign: 'center',
    },
    logoBox: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 18,
    },
    logoImg: {
      width: 64,
      height: 64,
      marginBottom: 6,
      borderRadius: 16,
      background: '#fff',
    },
    logoTextImg: {
      height: 30,
      marginLeft: 8,
      resizeMode: 'contain',
    },
    title: {
      marginBottom: '18px',
      color: '#222',
      fontSize: '24px',
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '13px',
      textAlign: 'left',
    },
    label: {
      fontSize: '15px',
      marginBottom: '3px',
      color: '#444',
      fontWeight: 500,
    },
    input: {
      width: '100%',
      padding: '11px',
      borderRadius: '6px',
      border: '1.5px solid #e0e0e0',
      fontSize: '15px',
      background: '#fafbfc',
    },
    button: {
      width: '100%',
      padding: '13px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'opacity 0.2s, box-shadow 0.2s',
      fontWeight: 'bold',
      marginTop: 6,
      boxShadow: '0 2px 8px rgba(40,167,69,0.08)',
    },
    registerButton: {
      background: 'linear-gradient(90deg, #28a745 60%, #007bff 100%)',
      color: '#fff',
    },
    googleButton: {
      backgroundColor: '#fff',
      color: '#222',
      border: '1.5px solid #db4437',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      boxShadow: '0 2px 8px rgba(219,68,55,0.08)',
      marginTop: 0,
    },
    googleIcon: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      border: '2px solid #111',
    },
    hr: {
      margin: '22px 0',
      border: 'none',
      borderTop: '1px solid #eee',
    },
    bottomText: {
      marginTop: 18,
      color: '#666',
      fontSize: 15,
      textAlign: 'center',
    },
    link: {
      color: '#007bff',
      textDecoration: 'underline',
      marginLeft: 6,
    },
  };

  const handleHover = (e) => (e.target.style.opacity = 0.85);
  const handleLeave = (e) => (e.target.style.opacity = 1);

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
        <h2 style={styles.title}>Criar Conta</h2>
        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>Nome</label>
          <input
            type="text"
            placeholder="Seu nome completo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={styles.input}
            required
          />
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
            autoComplete="new-password"
          />
          <label style={styles.label}>Confirmar Senha</label>
          <input
            type="password"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
            autoComplete="new-password"
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={() => setAcceptTerms(!acceptTerms)}
            />
            <label htmlFor="acceptTerms" style={styles.label}>
              Eu li e aceito os <Link to="/terms" style={styles.link}>Termos de Uso</Link>
            </label>
          </div>
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
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={styles.googleIcon}

          />
          Criar Conta com Google
        </button>
        <div style={styles.bottomText}>
          Já tem conta?
          <Link to="/login" style={styles.link}>Entrar</Link>
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <AdSense adSlot="4451812486" style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }} />
      </div>
    </div>
  );
};

export default Register;
