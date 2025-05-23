import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../AuthContext";
import AdSense from "../components/AdSense";
import logo from "../icons/logo.png";
import logoText from "../icons/logoEscrito.png";

const Home = () => {
  const { currentUser } = useAuth();
  const [hoveredCard, setHoveredCard] = React.useState(null);

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
        <img src={logo} alt="Logo DoaFácil" style={styles.logoImg} />
        <img src={logoText} alt="Texto DoaFácil" style={styles.logoTextImg} />
        <p style={styles.subtitle}>
          Conectando pessoas para transformar doações em oportunidades.
        </p>
        <div style={styles.headerActions}>
          {currentUser ? (
            <Link to="/donations" style={styles.headerButton}>
              Ver Doações
            </Link>
          ) : (
            <>
              <Link to="/login" style={styles.headerButton}>Entrar</Link>
              <Link to="/register" style={{ ...styles.headerButton, background: "#007bff" }}>Criar Conta</Link>
            </>
          )}
        </div>
      </header>

      <section style={styles.aboutSection}>
        <h2 style={styles.sectionTitle}>Nossa Missão</h2>
        <p style={styles.paragraph}>
          O <b>DoaFácil</b> é uma plataforma inovadora que facilita a doação de itens, promovendo a redução do desperdício e estimulando a solidariedade na comunidade.<br />
          Nosso objetivo é transformar doações em oportunidades, contribuindo para um desenvolvimento sustentável e a melhoria da qualidade de vida.
        </p>
        <ul style={styles.missionList}>
          <li>✔️ Reduzir o desperdício e incentivar a reutilização</li>
          <li>✔️ Aproximar quem quer doar de quem precisa</li>
          <li>✔️ Promover impacto social e ambiental positivo</li>
        </ul>
      </section>

      <section style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>O que oferecemos</h2>
        <div style={styles.cardsContainer}>
          {[
            {
              title: "Sustentabilidade",
              text: "Contribuímos para a redução de resíduos, incentivando a reutilização de itens e promovendo a economia circular."
            },
            {
              title: "Conexão Comunitária",
              text: "Aproximamos pessoas, permitindo que quem deseja doar e quem precisa se conectem de forma simples e rápida."
            },
            {
              title: "Transparência",
              text: "Com tecnologia de ponta, garantimos que todas as doações sejam registradas de forma segura e transparente."
            },
            {
              title: "Facilidade",
              text: "Interface intuitiva, cadastro rápido e acompanhamento das doações em tempo real."
            }
          ].map((card, idx) => (
            <div
              key={card.title}
              style={{
                ...styles.card,
                ...(hoveredCard === idx ? styles.cardHover : {})
              }}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <p style={styles.cardText}>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.stepsSection}>
        <h2 style={styles.sectionTitle}>Como funciona?</h2>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <span style={styles.stepNumber}>1</span>
            <p style={styles.stepText}>Cadastre-se gratuitamente</p>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>2</span>
            <p style={styles.stepText}>Publique ou encontre doações</p>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>3</span>
            <p style={styles.stepText}>Converse e combine a entrega</p>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>4</span>
            <p style={styles.stepText}>Avalie e inspire outros!</p>
          </div>
        </div>
      </section>

      <section style={styles.callToActionSection}>
        <h2 style={styles.sectionTitle}>Junte-se a nós!</h2>
        <p style={styles.paragraph}>
          Faça parte de uma rede colaborativa que transforma vidas. Seja doando, seja ajudando a divulgar, seu gesto faz a diferença!
        </p>
        {currentUser ? (
          <Link to="/add-donation" style={styles.ctaButton}>
            Quero Doar Agora
          </Link>
        ) : (
          <Link to="/register" style={styles.ctaButton}>
            Criar Conta Grátis
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
    color: "#222",
    background: "linear-gradient(135deg, #28a745 0%, #007bff 100%)",
    minHeight: "100vh",
    textAlign: "center",
    padding: "0 0 40px 0",
  },
  header: {
    padding: "48px 20px 32px 20px",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "0 0 18px 18px",
    marginBottom: "32px",
    boxShadow: "0 4px 24px rgba(40,167,69,0.10)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 900, // igual às outras sections
    marginLeft: "auto",
    marginRight: "auto",
  },
  logoImg: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 18,
    boxShadow: "0 2px 12px rgba(40,167,69,0.10)",
    background: "#fff"
  },
  title: {
    fontSize: "48px",
    margin: "0 0 10px",
    fontWeight: "bold",
    color: "#28a745",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: "22px",
    margin: "0 0 18px",
    color: "#333",
    fontWeight: 500,
  },
  headerActions: {
    display: "flex",
    gap: "16px",
    marginTop: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  headerButton: {
    padding: "12px 28px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "18px",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
    transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
    border: "none",
    outline: "none",
    marginTop: 0,
    letterSpacing: 0.5,
    cursor: "pointer",
  },
  aboutSection: {
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: "40px 20px",
    borderRadius: "12px",
    margin: "0 auto 30px",
    maxWidth: 900,
    boxShadow: "0 2px 12px rgba(40,167,69,0.08)",
  },
  missionList: {
    listStyle: "none",
    padding: 0,
    margin: "24px auto 0",
    maxWidth: 500,
    color: "#28a745",
    fontWeight: "bold",
    fontSize: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoSection: {
    padding: "40px 20px",
    borderTop: "1px solid rgba(40,167,69,0.12)",
    borderBottom: "1px solid rgba(40,167,69,0.12)",
    margin: "0 auto 30px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "12px",
    maxWidth: 900, // igual às outras sections
    boxShadow: "0 2px 12px rgba(40,167,69,0.08)",
  },
  cardsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "24px",
    marginTop: "18px",
  },
  card: {
    backgroundColor: "rgba(40,167,69,0.07)",
    borderRadius: "10px",
    padding: "24px 18px",
    maxWidth: "260px",
    minWidth: "200px",
    textAlign: "left",
    boxShadow: "0 2px 8px rgba(40,167,69,0.07)",
    flex: "1 1 200px",
    transition: "transform 0.18s, box-shadow 0.18s",
    cursor: "pointer",
  },
  cardHover: {
    transform: "scale(1.06)",
    boxShadow: "0 4px 18px rgba(40,167,69,0.18)",
  },
  cardTitle: {
    fontSize: "22px",
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#28a745",
  },
  cardText: {
    fontSize: "16px",
    lineHeight: "1.5",
    color: "#333",
  },
  stepsSection: {
    padding: "40px 20px",
    margin: "0 auto 30px",
    background: "rgba(255,255,255,0.92)",
    borderRadius: "12px",
    maxWidth: 900, // igual às outras sections
    boxShadow: "0 2px 12px rgba(40,167,69,0.08)",
  },
  stepsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  step: {
    background: "linear-gradient(135deg, #28a745 60%, #007bff 100%)",
    color: "#fff",
    borderRadius: "50%",
    width: 110, // maior para caber texto
    height: 110,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "15px",
    boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
    marginBottom: "8px",
    padding: 0,
  },
  stepNumber: {
    fontSize: "26px", // menor
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#fff",
  },
  stepText: {
    fontSize: "13px", // menor
    color: "#fff",
    margin: 0,
    fontWeight: 500,
    textAlign: "center",
    padding: "0 8px",
  },
  callToActionSection: {
    padding: "40px 20px",
    margin: "0 auto 30px",
    background: "rgba(255,255,255,0.97)",
    borderRadius: "12px",
    maxWidth: 900, // igual às outras sections
    boxShadow: "0 2px 12px rgba(40,167,69,0.08)",
  },
  ctaButton: {
    display: "inline-block",
    textDecoration: "none",
    padding: "16px 38px",
    background: "linear-gradient(90deg, #ffc107 60%, #ff9800 100%)",
    color: "#333",
    borderRadius: "8px",
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "20px",
    transition: "background 0.3s, transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(255,193,7,0.10)",
    border: "none",
    outline: "none",
    letterSpacing: 0.5,
    cursor: "pointer",
  },
  logoTextImg: {
    height: 30,   // ou ajuste conforme o tamanho ideal
    marginLeft: 8, 
    resizeMode: 'contain',
    marginBottom: 10,
  }
};

export default Home;