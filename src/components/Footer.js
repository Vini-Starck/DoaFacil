// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Import the CSS file

const Footer = () => {
  return (
    <footer className="footer"> {/* Apply the 'footer' class */}
      <div className="footer-title"> {/* Apply the 'footer-title' class */}
        <Link to="/">
          DoaFácil
        </Link>
      </div>
      <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
      <p>Desenvolvido por <a href="https://starck-portifolio.web.app/" target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(#007bff 52%, #28a745 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vinícius Starck</a></p>

      <div className="footer-links">
        <Link to="/">Sobre</Link>
        <Link to="/support">Suporte</Link>
      </div>
    </footer>
  );
};

export default Footer;
