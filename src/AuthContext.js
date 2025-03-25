// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./config/firebase"; // Importa a configuração do Firebase
import { onAuthStateChanged } from "firebase/auth";

// Criando o contexto
const AuthContext = createContext();

// Provedor de autenticação
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para acessar o contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
