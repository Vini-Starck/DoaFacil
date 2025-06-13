import React, { useState } from 'react';
import { Link } from 'react-router-dom';



const steps = [
  {
    title: 'Acesso Inicial',
    content: [
      'Abra o navegador e acesse https://doafacil-ab7e4.web.app/',
    ],
  },
  {
    title: 'Tela de Boas-Vindas',
    content: [
      'Você verá uma breve descrição do aplicativo.',
      'Escolha entre:',
      '- Cadastrar-se',
      '- Entrar',
    ],
  },
  {
    title: 'Cadastro de Usuário',
    content: [
      'Escolha entre email/senha ou conta Google.',
      'Preencha seu nome, email e senha ou confirme login social.',
      'Após confirmação, você será redirecionado ao Dashboard.',
    ],
  },
  {
    title: 'Login',
    content: [
      'Insira seu email e senha ou confirme conta Google.',
      'Em caso de sucesso, irá ao Dashboard; em caso de falha, verá uma mensagem de erro.',
    ],
  },
  {
    title: 'Dashboard (Home)',
    content: [
      'Aqui estão os atalhos para principais ações:',
      '• Cadastrar Doação',
      '• Visualizar Doações',
      '• Minhas Doações',
      '• Notificações',
      '• Perfil',
      '• Suporte',
      '• Plano Premium',
    ],
  },
  {
    title: 'Cadastro de Doação',
    content: [
      'Preencha o formulário com:',
      '- Título (máx. 50 caracteres)',
      '- Descrição (máx. 500 caracteres)',
      '- Localização: digitar ou usar GPS',
      '- Até 5 pares nome/valor',
      '- Imagem do item',
      'Limite gratuito: 5 doações ativas.',
    ],
  },
  {
    title: 'Visualizar Doações',
    content: [
      'a) Lista filtrada: palavra-chave, tipo de item ou “mais próximas”.',
      'b) Mapa interativo: clique nos marcadores para ver detalhes e solicitar.',
    ],
  },
  {
    title: 'Solicitar Doação',
    content: [
      'Clique em “Quero esta doação”.',
      'Limite gratuito: 3 solicitações pendentes.',
      'O dono recebe notificação e decide aceitar ou recusar.',
    ],
  },
  {
    title: 'Chat Integrado',
    content: [
      'Após aceitar, chat é criado entre doador e beneficiário.',
      'Combine horários e detalhes de retirada.',
    ],
  },
  {
    title: 'Minhas Doações',
    content: [
      'Duas abas: Ativas e Concluídas.',
      'Doador ou beneficiário clica em “Concluir” para finalizar.',
    ],
  },
  {
    title: 'Avaliação Pós-Doação',
    content: [
      'Ambos avaliam (1–5 estrelas + comentário).',
      'Avaliação aparece no perfil e fortalece a reputação.',
    ],
  },
  {
    title: 'Suporte e Perfil',
    content: [
      'No Perfil acesse suporte, altere nome, veja notificações ou exclua conta.',
      'Em Suporte, envie ticket com assunto e descrição.',
    ],
  },
];

const ComoUsar = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div style={styles.page}>
      
      <div style={styles.container}>
        <h1 style={styles.title}>Como Usar o DoaFácil</h1>
        {steps.map((step, idx) => (
          <div key={idx} style={styles.stepBox}>
            <div
              style={styles.stepHeader}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
            >
              <span>{step.title}</span>
              <span style={styles.toggleIcon}>
                {activeIndex === idx ? '−' : '+'}
              </span>
            </div>
            {activeIndex === idx && (
              <ul style={styles.stepContent}>
                {step.content.map((line, li) => (
                  <li key={li}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div style={styles.bottomText}>
          Volte para a <Link to="/" style={styles.link}>Home</Link> a qualquer momento.
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    width: '100%',
    maxWidth: '600px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    padding: '24px',
  },
  title: {
    fontSize: '28px',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: '16px',
  },
  stepBox: {
    borderBottom: '1px solid #eee',
    padding: '12px 0',
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#333',
  },
  toggleIcon: {
    fontSize: '20px',
    lineHeight: '20px',
  },
  stepContent: {
    marginTop: '8px',
    paddingLeft: '16px',
    color: '#555',
  },
  bottomText: {
    marginTop: '24px',
    textAlign: 'center',
    color: '#666',
  },
  link: {
    color: '#007bff',
    textDecoration: 'underline',
  },
};

export default ComoUsar;
