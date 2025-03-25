// src/utils/chatUtils.js
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export const createOrGetChat = async (fromUserId, toUserId) => {
  // A convenção é que o documento de chat possui um campo 'participants' que é um array com os dois uids
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", fromUserId));
  const querySnapshot = await getDocs(q);
  
  let chat = null;
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Verifica se o outro usuário também está presente
    if (data.participants.includes(toUserId)) {
      chat = { id: doc.id, ...data };
    }
  });
  
  if (!chat) {
    // Se não existe, cria um novo chat com os dois participantes
    const chatDoc = await addDoc(chatsRef, {
      participants: [fromUserId, toUserId],
      createdAt: serverTimestamp(),
    });
    chat = { id: chatDoc.id };
  }
  
  return chat;
};
