import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfUse = () => {
  const navigate = useNavigate();

  const containerStyle = {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    height: '80vh',
    overflowY: 'auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
    lineHeight: '1.6',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '24px',
  };

  const buttonStyle = {
    marginTop: '24px',
    display: 'block',
    padding: '12px 24px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Termos de Uso do Aplicativo DoaFácil</h1>
      <p>Estes Termos de Uso ("Termos") regulam o acesso e uso do aplicativo móvel e da versão web DoaFácil, disponível em https://doafacil-ab7e4.web.app/. Leia atentamente antes de criar sua conta e utilizar nossos serviços.</p>

      <h2>Aceite dos Termos</h2>
      <p>Ao criar uma conta ou utilizar o DoaFácil, você declara que leu, entendeu e concorda integralmente com estes Termos, bem como com nossa Política de Privacidade. Caso não concorde com qualquer disposição, não crie conta nem utilize o serviço.</p>

      <h2>Definições</h2>
      <ul>
        <li><strong>Usuário:</strong> pessoa física que cria conta no DoaFácil.</li>
        <li><strong>Doador:</strong> Usuário que oferece itens para doação.</li>
        <li><strong>Beneficiário:</strong> Usuário que solicita e recebe itens doados.</li>
        <li><strong>Doação:</strong> oferta de item feita no aplicativo; inclui título, descrição, localização, imagens e campos extras.</li>
        <li><strong>Solicitação:</strong> pedido formal de doação enviado pelo Beneficiário ao Doador.</li>
        <li><strong>Chat:</strong> ferramenta de mensagens integrada para comunicação entre Doador e Beneficiário.</li>
        <li><strong>Plano Gratuito/Premium:</strong> modalidades de conta, cada qual com limites e recursos específicos.</li>
        <li><strong>Firebase:</strong> serviço de backend utilizado para autenticação, banco de dados e notificações.</li>
        <li><strong>Stripe/Firebase Payments:</strong> provedores de pagamento para assinatura do Plano Premium.</li>
      </ul>

      <h2>Criação de Conta e Autenticação</h2>
      <p>3.1. O Usuário pode cadastrar-se usando e-mail e senha ou conta Google.</p>
      <p>3.2. É vedado fornecer dados falsos ou de terceiros. Caso identifiquemos irregularidades, poderemos suspender ou encerrar sua conta.</p>
      <p>3.3. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</p>

      <h2>Uso do Serviço</h2>
      <p>4.1. O Usuário concorda em utilizar o DoaFácil apenas para finalidades lícitas.</p>
      <p>4.2. Cada Doador pode manter até 5 doações ativas no Plano Gratuito; no Premium, esse limite será ampliado conforme plano contratado.</p>
      <p>4.3. Cada Beneficiário pode ter até 3 solicitações pendentes no Plano Gratuito; em planos pagos, o limite será ajustado.</p>
      <p>4.4. Descreva com clareza o item que será doado, respeitando limites de caracteres (50 para título e 500 para descrição).</p>
      <p>4.5. É proibido oferecer itens ilegais, perigosos ou que violem direitos de terceiros.</p>

      <h2>Solicitação, Aceite e Recusa</h2>
      <p>5.1. Ao clicar em “Quero esta doação”, o Beneficiário envia uma notificação do tipo requestDonation ao Doador.</p>
      <p>5.2. O Doador pode aceitar ou recusar. Em caso de recusa, o status é alterado para declined e o Beneficiário é notificado.</p>
      <p>5.3. Ao aceitar, o status da doação passa a “em andamento”, é definido o Beneficiário, e são geradas notificações e um chat associado.</p>

      <h2>Chat e Conclusão</h2>
      <p>6.1. O chat permite negociar horários, locais e detalhes de retirada do item.</p>
      <p>6.2. Após entrega, o Doador ou o Beneficiário pode clicar em “Concluir”, encerrando a doação e fechando automaticamente o chat.</p>
      <p>6.3. Ambos usuários receberão solicitação de avaliação (estrelas e comentário), registrada no perfil de cada um.</p>

      <h2>Avaliações</h2>
      <p>7.1. Cada Usuário poderá avaliar o outro entre 1 e 5 estrelas e adicionar comentário.</p>
      <p>7.2. As avaliações fazem parte do perfil público, influenciando a reputação do Usuário.</p>

      <h2>Plano Premium e Pagamentos</h2>
      <p>8.1. Usuários Gratuitos podem migrar para planos pagos apresentados na seção “Plano Premium” do Dashboard.</p>
      <p>8.2. Pagamentos são processados pelo Stripe ou Firebase Payments, conforme selecionado.</p>
      <p>8.3. Assinaturas renovam-se automaticamente, salvo cancelamento prévio pelo Usuário.</p>
      <p>8.4. Política de reembolso seguirá as regras do provedor de pagamento.</p>

      <h2>Privacidade e Dados Pessoais</h2>
      <p>9.1. Coletamos dados de cadastro, localização, imagens e conteúdos das doações.</p>
      <p>9.2. Esses dados são usados para prestar o serviço e para notificações.</p>
      <p>9.3. Consulte nossa Política de Privacidade para detalhes sobre coleta, uso e compartilhamento de dados.</p>

      <h2>Conteúdo e Propriedade Intelectual</h2>
      <p>10.1. Todos os direitos autorais, marças e demais direitos de propriedade intelectual relacionados ao DoaFácil pertencem aos seus titulares.</p>
      <p>10.2. Você concede licença não exclusiva para o uso de imagens e conteúdos fornecidos por você no contexto do serviço.</p>

      <h2>Responsabilidades e Limitação de Responsabilidade</h2>
      <p>11.1. Você é o único responsável pela gestão das doações e pelo cumprimento das leis locais.</p>
      <p>11.2. O DoaFácil não se responsabiliza por eventual uso indevido da plataforma ou por danos diretos, indiretos, incidentais ou consequenciais decorrentes de seu uso.</p>

      <h2>Suspensão e Encerramento de Conta</h2>
      <p>12.1. Podemos suspender ou cancelar sua conta a qualquer momento, em caso de violação destes Termos ou de risco à segurança.</p>
      <p>12.2. Em caso de exclusão, todos os seus dados, doações e notificações serão permanentemente removidos.</p>

      <h2>Modificações nos Termos</h2>
      <p>Podemos alterar estes Termos a qualquer momento. Notificaremos os Usuários ativos por e-mail ou dentro do próprio aplicativo. O uso continuado após as alterações implica aceitação.</p>

      <h2>Lei Aplicável e Foro</h2>
      <p>Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.</p>

      <h2>Contato</h2>
      <p>Em caso de dúvidas ou suporte, acesse a seção “Suporte” no aplicativo.</p>

      <p><strong>Declaro que li e concordo com estes Termos de Uso.</strong></p>

      <button style={buttonStyle} onClick={() => navigate(-1)}>
        Voltar
      </button>
    </div>
  );
};

export default TermsOfUse;
