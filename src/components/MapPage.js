// src/components/MapPage.js
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import L from "leaflet";
import { useAuth } from "../AuthContext";
import MapDonationDetailModal from "./MapDonationDetailModal"; // Importe o modal

// Função auxiliar para criar um ícone dinâmico usando uma imagem
const createIcon = (imgUrl, size = [40, 40]) => {
  return L.divIcon({
    html: `
      <div style="
        width:${size[0]}px; 
        height:${size[1]}px; 
        border-radius:50%; 
        overflow:hidden; 
        border:2px solid #fff; 
        box-shadow: 0 0 5px rgba(0,0,0,0.5);
      ">
        <img 
          src="${imgUrl}" 
          style="width:100%; height:100%; object-fit:cover;" 
        />
      </div>
    `,
    className: "",
    iconSize: size,
  });
};

const MapPage = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);

  // Novo estado para controlar o modal de detalhes
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Obter a localização do usuário via GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }, []);

  // Buscar as doações que possuem coordenadas
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const donationRef = collection(db, "donationItems");
        const data = await getDocs(donationRef);
        const donationsData = data.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((donation) => donation.latitude && donation.longitude);

        setDonations(donationsData);
      } catch (error) {
        console.error("Erro ao buscar doações:", error);
      }
    };
    fetchDonations();
  }, []);

  // Ícone do usuário
  const userMarkerIcon =
    currentUser && currentUser.photoURL
      ? createIcon(currentUser.photoURL, [50, 50])
      : createIcon("https://cdn-icons-png.flaticon.com/512/149/149071.png", [50, 50]);

  // Lida com o clique em um ícone de doação
  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
  };

  // Fecha o modal
  const handleCloseModal = () => {
    setSelectedDonation(null);
  };

  // Renderização
  return currentPosition ? (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={currentPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker do Usuário */}
        <Marker position={currentPosition} icon={userMarkerIcon} />

        {/* Markers de Doações */}
        {donations.map((donation) => {
          const donationImg = donation.imageUrl
            ? `https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                donation.imageUrl
              )}?alt=media`
            : "https://cdn-icons-png.flaticon.com/512/684/684908.png";

          // Ícones normal e de hover
          const donationIconNormal = createIcon(donationImg, [40, 40]);
          const donationIconHover = createIcon(donationImg, [50, 50]);

          return (
            <Marker
              key={donation.id}
              position={[donation.latitude, donation.longitude]}
              icon={donationIconNormal}
              eventHandlers={{
                click: () => handleDonationClick(donation),
                mouseover: (e) => {
                  e.target.setIcon(donationIconHover);
                },
                mouseout: (e) => {
                  e.target.setIcon(donationIconNormal);
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* Modal de detalhes da doação */}
      {selectedDonation && (
        <MapDonationDetailModal
          donation={selectedDonation}
          onClose={handleCloseModal}
        />
      )}
    </div>
  ) : (
    <p>Carregando mapa...</p>
  );
};

export default MapPage;
