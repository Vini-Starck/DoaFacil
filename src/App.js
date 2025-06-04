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
import ConcludeDetailModal from "./components/ConcludeDetailModal";
import Plans from "./components/Plans";

function App() {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showConcludeModal, setShowConcludeModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportedDonationIds, setReportedDonationIds] = useState([]);
  const [requestsLeft, setRequestsLeft] = useState(0);

  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };

  const handleDonationReport = (id) => {
    setReportedDonationIds((prev) => [...prev, id]);
  };

  return (
    <div
      className="App"
      style={{
        background: "radial-gradient(circle,rgb(15, 62, 100) 0%, #007bff 52%, #28a745 100%)",
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
                    requestsLeft={requestsLeft}
                    setRequestsLeft={setRequestsLeft}
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
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/como-usar" element={<ComoUsar />} />
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/plans" element={<PrivateRoute element={<Plans />} />} />
        </Routes>
      </main>
      <Footer />
      {showModal && selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onReport={handleDonationReport}
          onClose={() => {
            setShowModal(false);
            setSelectedDonation(null);
          }}
          onRequestSuccess={() => setRequestsLeft((prev) => prev - 1)}
        />
      )}

      {showConcludeModal && selectedDonation && (
        <ConcludeDetailModal
          donation={selectedDonation}
          onClose={() => setShowConcludeModal(false)}
        />
      )}
    </div>
  );
}

export default App;
