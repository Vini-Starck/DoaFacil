// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: "#222",
      color: "#fff",
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "10px" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#fff", fontSize: "20px" }}>
          DoaFácil
        </Link>
      </div>
      <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
      <div style={{ marginTop: "10px" }}>
        <Link to="/" style={{ marginRight: "15px", color: "#fff", textDecoration: "none" }}>
          Sobre
        </Link>
        <Link to="/support" style={{ color: "#fff", textDecoration: "none" }}>
          Suporte
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
