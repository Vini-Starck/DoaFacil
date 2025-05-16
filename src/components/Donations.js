import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { db, storage } from "../config/firebase";
import { getDocs, collection } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

const Donations = ({ onDonationClick }) => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNearest, setFilterNearest] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

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
    if (filterNearest) {
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
  }, [filterNearest]);

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
    const titleMatch = donation.title.toLowerCase().includes(term);
    const descMatch = donation.description.toLowerCase().includes(term);
    const typeMatch = filterType ? donation.donationType === filterType : true;
    return (
      (titleMatch || descMatch) &&
      typeMatch &&
      donation.status === "disponível" &&
      donation.userId !== currentUser?.uid
    );
  });

  if (filterNearest && userLocation) {
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
      .sort((a, b) => a.distance - b.distance);
  }

  return (
    <section style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, maxWidth: 1200, margin: "0 auto" }}>
        <input
          type="text"
          placeholder="Pesquisar doações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #ccc", marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <input
              type="checkbox"
              checked={filterNearest}
              onChange={() => setFilterNearest(!filterNearest)}
            />
            Mostrar doações mais próximas
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
          >
            <option value="">Todos os Tipos</option>
            <option value="Roupas">Roupas</option>
            <option value="Móveis">Móveis</option>
            <option value="Eletrodomésticos">Eletrodomésticos</option>
            <option value="Alimentos">Alimentos</option>
          </select>
        </div>
      </div>

      {filteredDonations.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, padding: 20, maxWidth: 1200, margin: "0 auto" }}>
          {filteredDonations.map((donation) => {
            const isHovered = hoveredId === donation.id;
            return (
              <div
                key={donation.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 15,
                  borderRadius: 12,
                  boxShadow: isHovered ? "0 6px 12px rgba(0,0,0,0.2)" : "0 4px 8px rgba(0,0,0,0.1)",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                }}
                onClick={() => onDonationClick(donation)}
                onMouseEnter={() => setHoveredId(donation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {donation.imageUrl ? (
                  <img
                    src={donation.imageUrl}
                    alt="Imagem do item"
                    style={{ width: "100%", maxWidth: 200, height: 200, objectFit: "cover", borderRadius: 8, border: "2px solid #ddd", marginBottom: 10 }}
                  />
                ) : null}
                <div style={{ textAlign: "center", width: "100%" }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={donation.title}>
                    {donation.title}
                  </h2>
                  <p style={{ margin: "0 0 10px", color: "#666" }}>{donation.description}</p>
                  {filterNearest && donation.distance !== undefined && (
                    <p style={{ margin: 0, color: "#888" }}>
                      {donation.distance.toFixed(1)} km de distância
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação encontrada.</p>
      )}
    </section>
  );
};

export default Donations;