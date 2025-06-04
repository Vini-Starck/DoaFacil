// src/utils/userUtils.js
import { doc, getDoc, setDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { deleteUser } from "firebase/auth";

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

export const checkUserDonationsStatus = async (userId) => {
  const donationsRef = collection(db, "donationItems");
  const q = query(donationsRef, where("userId", "==", userId), where("status", "==", "em andamento"));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};


export const deleteUserAndDonations = async (userId) => {
  try {
    await runTransaction(db, async (transaction) => {
      // Referência para a coleção de doações
      const donationsRef = collection(db, "donationItems");

      // Consulta para encontrar todas as doações do usuário com status "disponível"
      const q = query(donationsRef, where("userId", "==", userId), where("status", "==", "disponível"));
      const querySnapshot = await getDocs(q);

      // Exclui cada doação encontrada
      for (const docSnap of querySnapshot.docs) {
        transaction.delete(docSnap.ref);
      }

      // Referência para o documento do usuário
      const userRef = doc(db, "users", userId);

      // Exclui o documento do usuário
      transaction.delete(userRef);
    });
    
    // Exclui o usuário do Auth
    const user = auth.currentUser;
    if (user && user.uid === userId) {
      await deleteUser(user);
    }

    return true;
  } catch (error) {
    console.error("Erro ao excluir usuário e doações:", error);
    return false;
  }
};



