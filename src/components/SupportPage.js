// src/components/SupportPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import AdSense from './AdSense';

export default function SupportPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Preencha todos os campos.' });
      return;
    }
    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setStatus({ type: 'success', text: 'Solicitação enviada com sucesso!' });
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Erro ao enviar solicitação.' });
    }
  };

  return (
    <div style={styles.page}>
            {/* AdSense acima do formulário */}
        <div style={{ margin: "0 auto 24px", maxWidth: 320 }}>
        <AdSense
            adSlot="4451812486"
            style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
        </div>
      <button onClick={() => navigate(-1)} style={styles.backButton}>&larr; Voltar</button>
      <div style={styles.container}>
        <h2>Suporte DoaFácil</h2>
        <p>Precisa de ajuda? Envie sua dúvida ou feedback abaixo.</p>
        {status && (
          <div style={status.type === 'error' ? styles.error : styles.success}>
            {status.text}
          </div>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={styles.input}
            placeholder="Ex.: Problema ao enviar solicitação"
          />

          <label style={styles.label}>Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.textarea}
            rows={6}
            placeholder="Descreva seu problema ou sugestão..."
          />

          <button type="submit" style={styles.submitBtn}>Enviar</button>
        </form>
      </div>
        {/* AdSense abaixo do formulário */}
        <div style={{ margin: "24px auto 0", maxWidth: 320 }}>
        <AdSense
            adSlot="4451812486"
            style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
        </div>
    </div>
  );
}

const styles = {
  page: { background: '#e9ecef', minHeight: '100vh', padding: 20 },
  backButton: { marginBottom: 10, background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: 14 },
  container: { maxWidth: 600, margin: '0 auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { marginTop: 15, fontWeight: 500, color: '#6c757d' },
  input: { width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 5, marginBottom: 10, fontSize: 16 },
  textarea: { width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 5, marginBottom: 10, fontSize: 16 },
  submitBtn: { padding: '10px 15px', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16, background: '#28a745', color: '#fff', marginTop: 10 },
  error: { marginTop: 10, color: '#dc3545' },
  success: { marginTop: 10, color: '#28a745' },
};
