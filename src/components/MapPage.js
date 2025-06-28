// src/components/MapPage.js
import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  OverlayView,
  useJsApiLoader,
} from "@react-google-maps/api";
import { getDocs, collection } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { useAuth } from "../AuthContext";
import DonationDetailModal from "./DonationDetailModal";

const containerStyle = { width: "100%", height: "100vh" };
const LIBRARIES = ["places"];

export default function MapPage({ reportedDonationIds = [], onReport }) {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDmkiXWowTV3HqXJF9sQFIrpImFOxC3lGA",// process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // 1) Pega posição
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) =>
        setCurrentPosition({ lat: coords.latitude, lng: coords.longitude }),
      console.error
    );
  }, []);

  const donationsToRender = donations.filter(
    (d) => !reportedDonationIds.includes(d.id)
  );

  // 2) Fetch + getDownloadURL + filtro de status e userId
  useEffect(() => {
    if (!currentUser) return;  // só busca depois de termos currentUser

    (async () => {
      const snap = await getDocs(collection(db, "donationItems"));
      const all = await Promise.all(
        snap.docs.map(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          // só converte se tiver caminho
          if (data.imageUrl) {
            try {
              data.imageUrl = await getDownloadURL(
                ref(storage, data.imageUrl)
              );
            } catch {
              data.imageUrl = null;
            }
          }
          return data;
        })
      );

      // aqui já aplicamos os filtros:
      const filtered = all
        .filter(
          (d) =>
            d.latitude != null &&
            d.longitude != null &&
            d.userId !== currentUser.uid &&   // não do seu próprio usuário
            d.status === "disponível"         // apenas disponíveis
        )
        .map((d) => ({
          ...d,
          imageUrl:
            d.imageUrl ||
            "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        }));

      setDonations(filtered);
    })().catch(console.error);
  }, [currentUser]);


  
  if (loadError) return <p>Erro ao carregar o mapa.</p>;
  if (!isLoaded || !currentPosition) return <p>Carregando mapa…</p>;

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition}
        zoom={13}
      >
        {donationsToRender.map((d) => (
          <OverlayView
            key={d.id}
            position={{ lat: d.latitude, lng: d.longitude }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => setSelectedDonation(d)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid white",
                boxShadow: "0 0 5px rgba(0,0,0,0.5)",
                transition: "transform 0.2s",
                cursor: "pointer",
              }}
            >
              <img
                src={d.imageUrl}
                alt={d.title || "Doação"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://cdn-icons-png.flaticon.com/512/684/684908.png";
                }}
              />
            </div>
          </OverlayView>
        ))}
      </GoogleMap>

      {selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => setSelectedDonation(null)}
          onReport={(id) => {
            onReport(id);
            setSelectedDonation(null); // fecha modal após denunciar
          }}
        />
      )}
    </>
  );
}
