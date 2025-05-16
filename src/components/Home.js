// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../AuthContext";
import AdSense from "../components/AdSense";

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div style={styles.page}>

      {/* AdSense acima do conteúdo */}
      <div style={{ margin: "0 auto 24px", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
      <header style={styles.header}>
        <h1 style={styles.title}>DoaFácil</h1>
        <p style={styles.subtitle}>
          Conectando pessoas para transformar doações em oportunidades.
        </p>
      </header>

      <section style={styles.aboutSection}>
        <h2 style={styles.sectionTitle}>Nossa Missão</h2>
        <p style={styles.paragraph}>
          O DoaFácil é uma plataforma inovadora que visa facilitar a doação de itens,
          promovendo a redução do desperdício e estimulando a solidariedade na comunidade.
          Nosso objetivo é transformar doações em oportunidades, contribuindo para um
          desenvolvimento sustentável e a melhoria da qualidade de vida.
        </p>
      </section>

      <section style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>O que oferecemos</h2>
        <div style={styles.cardsContainer}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Sustentabilidade</h3>
            <p style={styles.cardText}>
              Contribuímos para a redução de resíduos, incentivando a reutilização de itens e
              promovendo a economia circular.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Conexão Comunitária</h3>
            <p style={styles.cardText}>
              Aproximamos pessoas, permitindo que quem deseja doar e quem precisa se conectem
              de forma simples e rápida.
            </p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Transparência</h3>
            <p style={styles.cardText}>
              Com tecnologia de ponta, garantimos que todas as doações sejam registradas de forma
              segura e transparente.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.callToActionSection}>
        <h2 style={styles.sectionTitle}>Junte-se a nós!</h2>
        <p style={styles.paragraph}>
          Faça parte de uma rede colaborativa que transforma vidas. Seja doando, seja
          ajudando a divulgar, seu gesto faz a diferença!
        </p>
        {currentUser ? (
          <Link to="/donations" style={styles.ctaButton}>
            Ver Doações
          </Link>
        ) : (
          <Link to="/register" style={styles.ctaButton}>
            Criar Conta
          </Link>
        )}
      </section>

      {/* AdSense abaixo do conteúdo */}
      <div style={{ margin: "24px auto 0", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
    </div>
  );
};

const styles = {
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#fff",
    textAlign: "center",
    padding: "20px",
  },
  header: {
    padding: "40px 20px",
  },
  title: {
    fontSize: "48px",
    margin: "0 0 10px",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "20px",
    margin: "0",
  },
  sectionTitle: {
    fontSize: "32px",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  paragraph: {
    fontSize: "18px",
    lineHeight: "1.6",
    maxWidth: "800px",
    margin: "0 auto 30px",
  },
  aboutSection: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "40px 20px",
    borderRadius: "8px",
    marginBottom: "30px",
  },
  infoSection: {
    padding: "40px 20px",
    borderTop: "1px solid rgba(255,255,255,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    marginBottom: "30px",
  },
  cardsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "250px",
    textAlign: "left",
  },
  cardTitle: {
    fontSize: "24px",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  cardText: {
    fontSize: "16px",
    lineHeight: "1.4",
  },
  callToActionSection: {
    padding: "40px 20px",
  },
  ctaButton: {
    display: "inline-block",
    textDecoration: "none",
    padding: "15px 30px",
    backgroundColor: "#ffc107",
    color: "#333",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "bold",
    marginTop: "20px",
    transition: "background 0.3s",
  },
};

export default Home;
