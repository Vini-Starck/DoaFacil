// src/components/Plans.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const plans = [
  {
    id: 'basic',
    title: 'Plano Básico',
    requests: 3,
    donations: 5,
    price: 500, // R$ 5,00
    paymentUrl: 'https://www.abacatepay.com/pay/bill_D0WQ1QCmdQy3jNuhxuQCQXgB'
  },
  {
    id: 'intermediate',
    title: 'Plano Intermediário',
    requests: 5,
    donations: 10,
    price: 900, // R$ 9,00
    paymentUrl: 'https://www.abacatepay.com/pay/bill_PzyaRUsCEAhE6x1upm5nBEb5'
  },
  {
    id: 'advanced',
    title: 'Plano Avançado',
    requests: 10,
    donations: 20,
    price: 1500, // R$ 15,00
    paymentUrl: 'https://www.abacatepay.com/pay/bill_rDCKMeunrucwNJeCqJtCdayA'
  }
];

export default function Plans() {
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { search } = useLocation();

  // Após retorno do pagamento, URL: /plans?plan=basic&status=success
  useEffect(() => {
    const params = new URLSearchParams(search);
    const planId = params.get('plan');
    const status = params.get('status');
    if (status === 'success' && currentUser && planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        const userRef = doc(db, 'users', currentUser.uid);
        // Atualiza no Firestore
        (async () => {
          try {
            const snap = await getDoc(userRef);
            const data = snap.exists() ? snap.data() : {};
            const currentRequests = data.requestsLeft ?? 0;
            const currentDonations = data.donationsLeft ?? 0;
            await updateDoc(userRef, {
              requestsLeft: currentRequests + plan.requests,
              donationsLeft: currentDonations + plan.donations
            });
            setMessage(`Plano "${plan.title}" ativado! +${plan.requests} solicitações e +${plan.donations} doações adicionados.`);
            // limpa query
            navigate({ pathname: '/plans', search: '' }, { replace: true });
          } catch (err) {
            console.error('Erro ao atualizar usuário:', err);
            setError('Não foi possível atualizar seu plano.');
          }
        })();
      }
    }
  }, [search, currentUser, navigate]);

  const handlePurchase = (plan) => {
    if (!currentUser) {
      setError('Você precisa estar logado para comprar um plano.');
      return;
    }
    setError(null);
    // Redireciona para pagamento anexando callback de retorno
    window.location.href = `${plan.paymentUrl}?redirect_url=${encodeURIComponent(
      `${window.location.origin}/plans?plan=${plan.id}&status=success`
    )}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Escolha seu Plano</h1>
      {error && <p style={styles.error}>{error}</p>}
      {message && <p style={styles.message}>{message}</p>}
      <div style={styles.grid}>
        {plans.map(plan => (
          <div
            key={plan.id}
            style={styles.card}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          >
            <h3 style={styles.title}>{plan.title}</h3>
            <p>{plan.requests} solicitações de doação</p>
            <p>{plan.donations} doações</p>
            <p style={styles.price}>R$ {(plan.price / 100).toFixed(2)}</p>
            <button
              style={styles.button}
              onClick={() => handlePurchase(plan)}
            >
              Comprar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 800,
    margin: '0 auto'
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 12
  },
  message: {
    color: 'black',
    textAlign: 'center',
    marginBottom: 12
  },
  grid: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 16
  },
  card: {
    flex: '1 1 calc(33% - 32px)',
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  title: {
    marginBottom: 12,
    fontSize: 20,
    color: '#28a745'
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: '16px 0',
    color: '#007bff'
  },
  button: {
    padding: '12px 20px',
    fontSize: 16,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: '#fff',
    transition: 'background 0.2s'
  }
};
