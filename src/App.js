// src/App.js
import { useState } from "react";
import "./App.css";

import { Routes, Route } from "react-router-dom";

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
import DonationDetailModal from "./components/DonationDetailModal";
import MyDonations from "./components/MyDonations";
import PrivateRoute from "./components/PrivateRoute";
import EditDonation from "./components/EditDonation";


function App() {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };

  return (
    <div
      className="App"
      style={{
        background: "linear-gradient(135deg, #28a745, #007bff)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/donations"
            element={
              <PrivateRoute
                element={<Donations onDonationClick={handleDonationClick} />}
              />
            }
          />
          <Route path="/profile/:uid" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/add-donation" element={<PrivateRoute element={<AddDonation />} />} />
          <Route path="/my-donations" element={<PrivateRoute element={<MyDonations />} />} />
          <Route path="/chat/:chatId?" element={<PrivateRoute element={<ChatPage />} />} />
          <Route path="/map" element={<PrivateRoute element={<MapPage />} />} />
          <Route path="/notifications" element={<PrivateRoute element={<NotificationsPage />} />} />
          <Route path="/edit-donation/:id" element={<PrivateRoute element={<EditDonation />} />} />
          <Route
            path="/contact/:userId/:donationId"
            element={<PrivateRoute element={<ContactProfilePage />} />}
          />
        </Routes>
      </main>
      <Footer />
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
