import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../AuthContext';
import AdSense from './AdSense';

const categories = [
  'Erro de Navegação',
  'Falha no Cadastro',
  'Problema de Pagamento',
  'Bug no Chat',
  'Sugestão de Funcionalidade',
  'Outro',
];

export default function SupportPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('Erro de Navegação');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Por favor, preencha todos os campos.' });
      return;
    }
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        category,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setStatus({ type: 'success', text: 'Solicitação enviada com sucesso!' });
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Erro ao enviar solicitação. Tente novamente.' });
    }
  };

  return (
    <div style={styles.page}>
      <div style={{ margin: '0 auto 24px', maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        &larr; Voltar
      </button>
      <div style={styles.container}>
        <h2 style={styles.title}>Suporte DoaFácil</h2>
        <p style={styles.subtitle}>
          Selecione uma categoria e descreva com detalhes o problema ou sugestão.
        </p>
        {status && (
          <div style={status.type === 'error' ? styles.error : styles.success}>
            {status.text}
          </div>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label style={styles.label}>Assunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={styles.input}
            placeholder="Resumo do problema"
          />

          <label style={styles.label}>Descrição Detalhada</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.textarea}
            rows={6}
            placeholder="Detalhe o erro, passos para reproduzir, ou sua sugestão..."
          />

          <button type="submit" style={styles.submitBtn}>
            Enviar Solicitação
          </button>
        </form>
      </div>
      <div style={{ margin: '24px auto 0', maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f4f6f8', minHeight: '100vh', padding: 20 },
  backButton: {
    marginBottom: 10,
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: 14,
  },
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: 20,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
  title: { fontSize: 24, marginBottom: 8, color: '#28a745' },
  subtitle: { fontSize: 16, marginBottom: 16, color: '#555' },
  form: { display: 'flex', flexDirection: 'column' },
  label: { marginTop: 12, marginBottom: 4, fontWeight: 500, color: '#444' },
  select: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: 15,
    background: '#fafbfc',
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: 15,
    background: '#fafbfc',
  },
  textarea: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: 15,
    background: '#fafbfc',
  },
  submitBtn: {
    marginTop: 20,
    padding: '12px 20px',
    fontSize: 16,
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  error: { marginTop: 10, color: '#dc3545' },
  success: { marginTop: 10, color: '#28a745' },
};
