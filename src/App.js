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
import Donations from "./components/Donations";
import DonationDetailModal from "./components/DonationDetailModal";
import MyDonations from "./components/MyDonations";
import PrivateRoute from "./components/PrivateRoute";
import EditDonation from "./components/EditDonation";
import SupportPage from "./components/SupportPage";
import TermsOfUse from "./components/TermoDeUso";
import CheckEmail from "./components/CheckEmail";
import ComoUsar from "./components/ComoUsar";
import Dashboard from "./components/Dashboard";


function App() {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reportedDonationIds, setReportedDonationIds] = useState([]);

  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };

  // Callback para quando uma doação é denunciada
  const handleDonationReport = (id) => {
    setReportedDonationIds((prev) => [...prev, id]);
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
                element={
                  <Donations
                    onDonationClick={handleDonationClick}
                    reportedDonationIds={reportedDonationIds}
                  />
                }
              />
            }
          />
          <Route path="/profile/:uid" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/add-donation" element={<PrivateRoute element={<AddDonation />} />} />
          <Route path="/my-donations" element={<PrivateRoute element={<MyDonations />} />} />
          <Route path="/chat/:chatId?" element={<PrivateRoute element={<ChatPage />} />} />
          <Route
            path="/map"
            element={
              <PrivateRoute
                element={
                  <MapPage
                    reportedDonationIds={reportedDonationIds}
                    onReport={handleDonationReport}
                  />
                }
              />
            }
          />
          <Route path="/notifications" element={<PrivateRoute element={<NotificationsPage />} />} />
          <Route path="/edit-donation/:id" element={<PrivateRoute element={<EditDonation />} />} />
          <Route path="/support" element={<PrivateRoute element={<SupportPage />} />} />
          <Route path="/terms" element={ <TermsOfUse/>} />
          <Route path="/check-email" element={ <CheckEmail/>} />
          <Route path="/como-usar" element={ <ComoUsar/>} />
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        </Routes>
      </main>
      <Footer />
      {showModal && selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => setShowModal(false)}
          onReport={handleDonationReport}  // Passa a callback para o modal
        />
      )}
    </div>
  );
}

export default App;
