// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      color: "#fff",
      textAlign: "center"
    }}>
      <h2>Bem-vindo ao DoaFácil</h2>
      <p>
        DoaFácil é uma plataforma solidária que conecta pessoas para facilitar a doação de itens e reduzir o desperdício.
      </p>
      <p>
        Conheça nossos objetivos e faça parte desta rede colaborativa!
      </p>
      <Link to="/donations" style={{ 
          textDecoration: "none",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          borderRadius: "5px"
      }}>
        Ver Doações
      </Link>
    </div>
  );
};

export default Home;
