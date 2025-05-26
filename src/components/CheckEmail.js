// src/components/CheckEmail.js
import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { sendEmailVerification } from 'firebase/auth';

const CheckEmail = () => {
  const { state } = useLocation();
  const [resent, setResent] = useState(false);

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '80px auto',
      padding: '24px',
      textAlign: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <h2>Verifique seu e-mail</h2>
      <p>
        Enviamos um link de verificação para <strong>{state?.email}</strong>.
        <br />
        Por favor, abra sua caixa de entrada e clique no link para ativar sua conta.
      </p>
      <button onClick={resendVerification} style={{
        margin: '16px 0',
        padding: '12px 24px',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}>
        {resent ? 'Link reenviado!' : 'Reenviar e-mail de verificação'}
      </button>
      <p>
        Após verificar, 
        <Link to="/login" style={{ marginLeft: 4, color: '#007bff' }}>
          faça login aqui
        </Link>.
      </p>
    </div>
  );
};

export default CheckEmail;
