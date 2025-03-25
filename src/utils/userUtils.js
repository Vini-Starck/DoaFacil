// src/utils/userUtils.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const createUserDocumentIfNotExists = async (user, extraData = {}) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        displayName: user.displayName || extraData.displayName || "",
        email: user.email,
        // Se estiver no Register, pode incluir o CPF
        cpf: extraData.cpf || "",
        createdAt: new Date(),
        ...extraData,
      });
    } catch (error) {
      console.error("Erro ao criar documento do usuário", error);
    }
  }
};
