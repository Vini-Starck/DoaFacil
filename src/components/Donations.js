import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { db, storage } from "../config/firebase";
import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import AdSense from "./AdSense";
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
    // Pesquisa por cidade digitada (campo livre)
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
    <section style={styles.page}>


      {/* AdSense acima dos filtros/lista */}
      <div style={{ margin: "0 auto 24px", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>


      <div style={styles.container}>
        <h1 style={styles.title}>Doações Disponíveis</h1>


        {requestsLeft !== null && (
          <p style={{ textAlign: 'center', marginBottom: 16, color: requestsLeft === 0 ? 'red' : '#28a745', fontWeight: 'bold' }}>
            {requestsLeft > 0
              ? `Você ainda pode solicitar ${requestsLeft} doação(ões).`
              : 'Você atingiu o limite de solicitações. Considere adquirir um plano para desbloquear mais!'}
          </p>
        )}

        {requestsLeft === 0 && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={() => navigate('/plans')}
            >
              Ver Planos
            </button>
          </div>
        )}


        <div style={styles.filtersBar}>



          <input
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Pesquisar por cidade..."
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={styles.input}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={styles.select}
          >
            {donationTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={kmRange}
            onChange={(e) => setKmRange(Number(e.target.value))}
            style={styles.select}
          >
            {kmRanges.map((range) => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filterNearest}
              onChange={() => setFilterNearest(!filterNearest)}
              style={styles.checkbox}
            />
            <span>Mais próximas</span>
          </label>
        </div>

        
        {donationsToRender.length ? (
        <div style={styles.grid}>
          {donationsToRender.map((donation) => {
            const isHovered = hoveredId === donation.id;
            return (
              <div
                key={donation.id}
                style={{
                  ...styles.card,
                  ...(isHovered ? styles.cardHover : {})
                }}
                onClick={() => onDonationClick(donation)}
                onMouseEnter={() => setHoveredId(donation.id)}
                onMouseLeave={() => setHoveredId(null)}
                title={donation.title}
              >
                {donation.imageUrl ? (
                  <img
                    src={donation.imageUrl}
                    alt="Imagem do item"
                    style={styles.cardImage}
                  />
                ) : (
                  <div style={styles.noImage}>Sem imagem</div>
                )}
                <div style={styles.cardContent}>
                  <h2 style={styles.cardTitle}>{donation.title}</h2>
                  <p style={styles.cardDesc}>{donation.description}</p>
                  <div style={styles.cardMeta}>
                    <span style={styles.cardType}>{donation.donationType}</span>
                    {donation.city && (
                      <span style={styles.cardCity}>{donation.city}</span>
                    )}
                    {(filterNearest || kmRange > 0) && donation.distance !== undefined && (
                      <span style={styles.cardDistance}>
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
        <p style={styles.noResults}>Nenhuma doação encontrada.</p>
      )}

      </div>
      {/* AdSense abaixo da lista */}
      <div style={{ margin: "24px auto 0", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
        />
      </div>
    </section>
  );
};

const styles = {
  page: {
    background: "linear-gradient(135deg, #28a745 0%, #007bff 100%)",
    minHeight: "100vh",
    padding: "0 0 40px 0",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    background: "rgba(255,255,255,0.97)",
    borderRadius: 16,
    maxWidth: 1200,
    margin: "0 auto 32px",
    padding: "36px 24px 28px 24px",
    boxShadow: "0 8px 32px rgba(40, 167, 69, 0.10), 0 1.5px 8px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 24,
    letterSpacing: 1,
    textAlign: "center",
  },
  filtersBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "1.5px solid #e0e0e0",
    fontSize: 16,
    minWidth: 220,
    outline: "none",
    background: "#fafbfc",
    transition: "border 0.2s",
  },
  select: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "1.5px solid #e0e0e0",
    fontSize: 16,
    outline: "none",
    background: "#fafbfc",
    minWidth: 150,
    transition: "border 0.2s",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 15,
    color: "#222",
    fontWeight: 500,
    background: "#f6f6f6",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    userSelect: "none",
    border: "1.5px solid #e0e0e0",
  },
  checkbox: {
    accentColor: "#28a745",
    width: 18,
    height: 18,
    marginRight: 4,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
    gap: 28,
    padding: "10px 0",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 18,
    borderRadius: 14,
    boxShadow: "0 4px 12px rgba(40,167,69,0.08)",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "transform 0.18s, box-shadow 0.18s",
    transform: "scale(1)",
    border: "1.5px solid #e0e0e0",
    minHeight: 340,
    position: "relative",
  },
  cardHover: {
    transform: "scale(1.045)",
    boxShadow: "0 8px 24px rgba(40,167,69,0.16)",
    border: "1.5px solid #28a745",
  },
  cardImage: {
    width: "100%",
    maxWidth: 210,
    height: 180,
    objectFit: "cover",
    borderRadius: 10,
    border: "2px solid #dbdbdb",
    marginBottom: 14,
    background: "#fafbfc",
  },
  noImage: {
    width: 210,
    height: 180,
    borderRadius: 10,
    background: "#f0f0f0",
    color: "#aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontStyle: "italic",
    marginBottom: 14,
    fontSize: 15,
    border: "2px dashed #dbdbdb",
  },
  cardContent: {
    width: "100%",
    textAlign: "center",
  },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: 20,
    color: "#28a745",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardDesc: {
    margin: "0 0 10px",
    color: "#444",
    fontSize: 15,
    minHeight: 38,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
    fontSize: 14,
    flexWrap: "wrap",
  },
  cardType: {
    background: "#e8f5e9",
    color: "#28a745",
    borderRadius: 6,
    padding: "3px 10px",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardCity: {
    background: "#f0f0f0",
    color: "#007bff",
    borderRadius: 6,
    padding: "3px 10px",
    fontWeight: "bold",
    fontSize: 13,
  },
  cardDistance: {
    background: "#e3eafc",
    color: "#007bff",
    borderRadius: 6,
    padding: "3px 10px",
    fontWeight: "bold",
    fontSize: 13,
  },
  noResults: {
    textAlign: "center",
    color: "#666",
    fontSize: 18,
    margin: "40px 0",
  },
};

export default Donations;