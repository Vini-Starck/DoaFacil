import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AdSense from './AdSense';
import logo from '../icons/logo.png';

const Dashboard = () => {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Se não estiver autenticado, redireciona para login
        navigate('/login');
      }
    });

    document.body.style.background = 'linear-gradient(135deg, #28a745, #007bff)';
    return () => {
      document.body.style.background = null;
      unsubscribe();
    };
  }, [navigate]);

  const items = [
    { label: 'Cadastrar Doação', path: '/add-donation' },
    { label: 'Visualizar Doações', path: '/donations' },
    { label: 'Minhas Doações', path: '/my-donations' },
    { label: 'Mapa de Doações', path: '/map' },
    { label: 'Chat', path: '/chat' },
    { label: 'Notificações', path: '/notifications' },
    { label: 'Perfil', path: userId ? `/profile/${userId}` : '#' },  // ✅ Atualizado
    { label: 'Como Usar', path: '/como-usar' },
    { label: 'Suporte', path: '/support' },
    { label: 'Termos de Uso', path: '/terms' },
    { label: 'Planos', path: '/plans' },
  ];

  const handleHover = (e) => {
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
  };

  const handleLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
  };

  if (!userId) {
    // Pode mostrar um loading, ou simplesmente null enquanto verifica
    return <div>Carregando...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: 24 }}>
        <AdSense adSlot="4451812486" style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }} />
      </div>
      <div style={styles.container}>
        <div style={styles.header}>
          <img src={logo} alt="DoaFácil logo" style={styles.logo} />
          <h1 style={styles.title}>Dashboard</h1>
        </div>
        <div style={styles.grid}>
          {items.map((item) => (
            <Link
              to={item.path}
              key={item.path}
              style={styles.card}
              onMouseEnter={handleHover}
              onMouseLeave={handleLeave}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <AdSense adSlot="4451812486" style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }} />
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    width: '100%',
    maxWidth: 1000,
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    opacity: 1,
    transform: 'none',
    transition: 'opacity 0.5s ease, transform 0.5s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
    animation: 'rotate 10s linear infinite',
  },
  title: {
    fontSize: 28,
    color: '#28a745',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#333',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
};

export default Dashboard;
