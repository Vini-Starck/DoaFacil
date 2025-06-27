// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Import the CSS file

const Footer = () => {
  return (
    <footer className="footer"> {/* Apply the 'footer' class */}
      <div className="footer-title"> {/* Apply the 'footer-title' class */}
        <Link to="/">

        <p style={{
          background: 'linear-gradient(90deg, #28a745 60%, #007bff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block',
          marginBottom: '4px' // reduz o espaço abaixo de "DoaFácil"
        }}>
          DoaFácil
        </p>
        </Link>
        </div>

        <p style={{ marginTop: '4px' }}>© {new Date().getFullYear()} Todos os direitos reservados.</p>

        <p>
          Desenvolvido por{' '}
          <a 
            href="https://starck-portifolio.web.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              background: 'linear-gradient(90deg, #28a745 60%, #007bff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Vinícius Starck
          </a>
        </p>
      <div className="footer-links">
        <Link to="/">Sobre</Link>
        <Link to="/support">Suporte</Link>
      </div>
    </footer>
  );
};

export default Footer;
