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
      <div className="footer-links"> {/* Apply the 'footer-links' class */}
        <Link to="/">Sobre</Link>
        <Link to="/support">Suporte</Link>
      </div>
    </footer>
  );
};

export default Footer;
