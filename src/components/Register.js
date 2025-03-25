// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      // Cria o documento na coleção "users", passando também o CPF
      await createUserDocumentIfNotExists(user, { cpf });
      navigate('/');
    } catch (error) {
      alert("Erro ao registrar: " + error.message);
    }
  };

  const handleGoogleRegister = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      // Opcional: atualizar o profile do usuário com o displayName do Google, se necessário
      await updateProfile(user, { displayName: user.displayName });
      // Cria o documento na coleção "users", passando também a photoURL obtida do Google
      await createUserDocumentIfNotExists(user, { photoURL: user.photoURL });
      navigate('/');
    } catch (error) {
      alert("Erro ao registrar com Google: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center" }}>Criar Conta</h2>
      <form onSubmit={handleRegister}>
        <input 
          type="text" 
          placeholder="Nome" 
          value={displayName} 
          onChange={(e)=>setDisplayName(e.target.value)} 
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} 
        />
        <input 
          type="text" 
          placeholder="CPF" 
          value={cpf} 
          onChange={(e)=>setCpf(e.target.value)}
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e)=>setEmail(e.target.value)}
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} 
        />
        <input 
          type="password" 
          placeholder="Senha" 
          value={password} 
          onChange={(e)=>setPassword(e.target.value)}
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} 
        />
        <input 
          type="password" 
          placeholder="Confirmar Senha" 
          value={confirmPassword} 
          onChange={(e)=>setConfirmPassword(e.target.value)}
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} 
        />
        <button 
          type="submit" 
          style={{ width:"100%", padding:"10px", backgroundColor:"#28a745", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer" }}
        >
          Criar Conta
        </button>
      </form>
      <hr style={{ margin: "20px 0" }} />
      <button 
        onClick={handleGoogleRegister} 
        style={{ width:"100%", padding:"10px", backgroundColor:"#db4437", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer" }}
      >
        Criar Conta com Google
      </button>
    </div>
  );
};

export default Register;
