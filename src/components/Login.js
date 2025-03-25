// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUserDocumentIfNotExists } from '../utils/userUtils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Garante que o documento do usuário existe
      await createUserDocumentIfNotExists(user);
      navigate('/');
    } catch (error) {
      alert("Erro ao logar: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await createUserDocumentIfNotExists(user);
      navigate('/');
    } catch (error) {
      alert("Erro ao logar com Google: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center" }}>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} 
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} />
        <input type="password" placeholder="Senha" value={password} onChange={(e)=>setPassword(e.target.value)}
          style={{ width:"100%", padding:"10px", marginBottom:"10px", borderRadius:"5px", border:"1px solid #ccc" }} />
        <button type="submit" style={{ width:"100%", padding:"10px", backgroundColor:"#28a745", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer" }}>
          Logar
        </button>
      </form>
      <hr style={{ margin: "20px 0" }} />
      <button onClick={handleGoogleLogin} style={{ width:"100%", padding:"10px", backgroundColor:"#db4437", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer" }}>
        Logar com Google
      </button>
    </div>
  );
};

export default Login;
