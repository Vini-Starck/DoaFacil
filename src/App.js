// src/App.js
import { useEffect, useState } from "react";
import "./App.css";
import { db, auth } from "./config/firebase";
import { getDocs, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route, Link } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import AddDonation from "./components/AddDonation";
import MapPage from "./components/MapPage";
import ChatPage from "./components/ChatPage";
import NotificationsPage from "./components/NotificationsPage";
import ContactProfilePage from "./components/Contact";
import Donations from "./components/Donations";
import DonationDetailModal from "./components/DonationDetailModal"; // Se você estiver usando modal para detalhes
import MyDonations from "./components/MyDonations";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [donationList, setDonationList] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const donationsCollectionRef = collection(db, "donationItems");

  const getDonationList = async () => {
    try {
      const data = await getDocs(donationsCollectionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setDonationList(filteredData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        getDonationList();
      } else {
        setDonationList([]);
      }
    });
    return unsubscribe;
  }, []);

  // Filtra para exibir somente doações criadas por outros usuários
  const filteredDonations = donationList.filter(
    (donation) => donation.userId !== currentUser?.uid
  );

  // Callback ao clicar em uma doação para exibir detalhes (modal ou redirecionamento)
  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };

  return (
    <div
      className="App"
      style={{
        background: "linear-gradient(to bottom, #fff, #000)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header currentUser={currentUser} />
      <main style={{ flex: 1 }}>

        

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        
          {/* Rotas protegidas */}
          <Route path="/donations" element={<PrivateRoute element={<Donations
                donations={filteredDonations}
                onDonationClick={handleDonationClick}
              />}/>}/>
          <Route path="/profile/:uid" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/add-donation" element={<PrivateRoute element={<AddDonation />} />} />
          <Route path="/my-donations" element={<PrivateRoute element={<MyDonations />} />} />
          <Route path="/chat" element={<PrivateRoute element={<ChatPage />} />} />
          <Route path="/map" element={<PrivateRoute element={<MapPage />} />} />
          <Route path="/notifications" element={<PrivateRoute element={<NotificationsPage />} />} />
          <Route path="/contact/:userId/:donationId" element={<PrivateRoute element={<ContactProfilePage />} />} />
      </Routes>








      </main>
      <Footer />
      {/* Modal de detalhes da doação */}
      {showModal && selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;
