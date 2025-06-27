import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { db, storage } from "../config/firebase";
import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

import "./Donations.css";
import { useNavigate } from "react-router-dom";

const donationTypes = [
  { value: "", label: "Todos os Tipos" },
  { value: "Roupas", label: "Roupas" },
  { value: "Móveis", label: "Móveis" },
  { value: "Eletrodomésticos", label: "Eletrodomésticos" },
  { value: "Alimentos", label: "Alimentos" },
];

const kmRanges = [
  { value: 0, label: "Qualquer distância" },
  { value: 5, label: "Até 5 km" },
  { value: 10, label: "Até 10 km" },
  { value: 25, label: "Até 25 km" },
  { value: 50, label: "Até 50 km" },
  { value: 100, label: "Até 100 km" },
];

const Donations = ({ onDonationClick, reportedDonationIds }) => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNearest, setFilterNearest] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [kmRange, setKmRange] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [hiddenDonations, setHiddenDonations] = useState([]);
  const [requestsLeft, setRequestsLeft] = useState(null);
  const navigate = useNavigate();

  // Fetch hidden donations
  useEffect(() => {
    const fetchHiddenDonations = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDocs(collection(db, "users", currentUser.uid, "hiddenDonations"));
        const hiddenIds = snap.docs.map((docSnap) => docSnap.id);
        setHiddenDonations(hiddenIds);
      } catch (error) {
        console.error("Erro ao buscar doações ocultadas:", error);
      }
    };

    const fetchRequestsLeft = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setRequestsLeft(userDoc.data().requestsLeft);
        }
      } catch (error) {
        console.error("Erro ao buscar requestsLeft:", error);
      }
    };

    fetchHiddenDonations();
    fetchRequestsLeft();
  }, [currentUser]);

  // Fetch donations + resolve image URLs
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const snap = await getDocs(collection(db, "donationItems"));
        const items = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const data = { id: docSnap.id, ...docSnap.data() };
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
        setDonations(items);
      } catch (error) {
        console.error("Erro ao buscar doações:", error);
      }
    };

    fetchDonations();


  }, []);

  // Get user location if filtering nearest
  useEffect(() => {
    if (filterNearest || kmRange > 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => console.error("Erro ao obter localização:", err),
        { enableHighAccuracy: true }
      );
    }
  }, [filterNearest, kmRange]);

  // Haversine
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Apply filters
  let filteredDonations = donations.filter((donation) => {
    const term = searchTerm.toLowerCase();
    const cityTerm = filterCity.toLowerCase();
    const titleMatch = donation.title?.toLowerCase().includes(term);
    const descMatch = donation.description?.toLowerCase().includes(term);
    const typeMatch = filterType ? donation.donationType === filterType : true;
    // Pesquisa por cidade digitada (campo libre)
    const cityMatch = cityTerm
      ? (donation.location || "").toLowerCase().includes(cityTerm)
      : true;
    const notHidden = !hiddenDonations.includes(donation.id); // Exclude hidden donations
    return (
      (titleMatch || descMatch) &&
      typeMatch &&
      cityMatch &&
      notHidden &&
      donation.status === "disponível" &&
      donation.userId !== currentUser?.uid
    );
  });

  // Add distance if needed
  if ((filterNearest || kmRange > 0) && userLocation) {
    filteredDonations = filteredDonations
      .map((d) => ({
        ...d,
        distance:
          d.latitude && d.longitude
            ? getDistance(
                userLocation.latitude,
                userLocation.longitude,
                d.latitude,
                d.longitude
              )
            : Infinity,
      }))
      .filter((d) =>
        kmRange > 0 ? d.distance !== undefined && d.distance <= kmRange : true
      )
      .sort((a, b) => a.distance - b.distance);
  }

  const donationsToRender = filteredDonations.filter(
    (donation) => !reportedDonationIds.includes(donation.id)
  );

  return (
    <section className="donations-page">
      <div className="donations-container">
        <h1 className="donations-title">Doações Disponíveis</h1>

        {requestsLeft !== null && (
          <p className={`requests-info ${requestsLeft === 0 ? 'limit-reached' : 'available'}`}>
            {requestsLeft > 0
              ? `Você ainda pode solicitar ${requestsLeft} doação(ões).`
              : 'Você atingiu o limite de solicitações. Considere adquirir um plano para desbloquear mais!'}
          </p>
        )}

        {requestsLeft === 0 && (
          <div className="plans-button-container">
            <button
              className="plans-button"
              onClick={() => navigate('/plans')}
            >
              Ver Planos
            </button>
          </div>
        )}

        <div className="filters-bar">
          <input
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filters-bar input"
          />
          <input
            type="text"
            placeholder="Pesquisar por cidade..."
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="filters-bar input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filters-bar select"
          >
            {donationTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={kmRange}
            onChange={(e) => setKmRange(Number(e.target.value))}
            className="filters-bar select"
          >
            {kmRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterNearest}
              onChange={() => setFilterNearest(!filterNearest)}
              className="checkbox-label input"
            />
            <span>Mais próximas</span>
          </label>
        </div>

        {donationsToRender.length ? (
          <div className="donations-grid">
            {donationsToRender.map((donation) => {
              const isHovered = hoveredId === donation.id;
              return (
                <div
                  key={donation.id}
                  className={`donation-card ${isHovered ? 'card-hover' : ''}`}
                  onClick={() => onDonationClick(donation)}
                  onMouseEnter={() => setHoveredId(donation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={donation.title}
                >
                  {donation.imageUrl ? (
                    <img
                      src={donation.imageUrl}
                      alt="Imagem do item"
                      className="card-image"
                    />
                  ) : (
                    <div className="no-image">Sem imagem</div>
                  )}
                  <div className="card-content">
                    <h2 className="card-title">{donation.title}</h2>
                    <p className="card-desc">{donation.description}</p>
                    <div className="card-meta">
                      <span className="card-type">{donation.donationType}</span>
                      {donation.city && (
                        <span className="card-city">{donation.city}</span>
                      )}
                      {(filterNearest || kmRange > 0) && donation.distance !== undefined && (
                        <span className="card-distance">
                          {donation.distance !== Infinity
                            ? `${donation.distance.toFixed(1)} km`
                            : "Distância desconhecida"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-results">Nenhuma doação encontrada.</p>
        )}
      </div>
    </section>
  );
};

export default Donations;
