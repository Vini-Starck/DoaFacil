// src/components/Donations.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

const Donations = ({ donations, onDonationClick }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNearest, setFilterNearest] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Obter localização do usuário quando a opção "mais próximas" estiver ativada
  useEffect(() => {
    if (filterNearest) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error("Erro ao obter localização:", error),
        { enableHighAccuracy: true }
      );
    }
  }, [filterNearest]);

  // Função para calcular a distância entre dois pontos (fórmula de Haversine)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
  };

  // Filtrar doações com base nos filtros atuais, além de:
  // - Exibir apenas doações de outros usuários
  // - Exibir apenas doações com status "disponível"
  let filteredDonations = donations.filter((donation) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = donation.title.toLowerCase().includes(term);
    const descriptionMatch = donation.description.toLowerCase().includes(term);
    const typeMatch = filterType ? donation.donationType === filterType : true;
    return (
      (titleMatch || descriptionMatch) &&
      typeMatch &&
      donation.status === "disponível" &&
      donation.userId !== currentUser?.uid
    );
  });

  // Se a opção "Mais Próximas" estiver ativada, ordenar por distância
  if (filterNearest && userLocation) {
    filteredDonations = filteredDonations
      .map((donation) => ({
        ...donation,
        distance:
          donation.latitude && donation.longitude
            ? getDistance(
                userLocation.latitude,
                userLocation.longitude,
                donation.latitude,
                donation.longitude
              )
            : Infinity,
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  return (
    <section style={{ padding: "20px" }}>
      {/* Área de Filtros */}
      <div style={{ marginBottom: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <input
          type="text"
          placeholder="Pesquisar doações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            marginBottom: "10px",
          }}
        />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
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
            style={{
              flex: "1",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            padding: "20px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {filteredDonations.map((donation) => {
            const isHovered = hoveredId === donation.id;
            return (
              <div
                key={donation.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "15px",
                  borderRadius: "12px",
                  boxShadow: isHovered
                    ? "0 6px 12px rgba(0, 0, 0, 0.2)"
                    : "0 4px 8px rgba(0, 0, 0, 0.1)",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  transform: isHovered ? "scale(1.02)" : "scale(1)",
                }}
                onClick={() => onDonationClick(donation)}
                onMouseEnter={() => setHoveredId(donation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {donation.imageUrl && (
                  <img
                    src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                      donation.imageUrl
                    )}?alt=media`}
                    alt="Imagem do item"
                    style={{
                      width: "100%",
                      maxWidth: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "2px solid #ddd",
                      marginBottom: "10px",
                    }}
                  />
                )}
                <div style={{ textAlign: "center", width: "100%" }}>
                  <h2
                    style={{
                      margin: "0 0 5px",
                      fontSize: "18px",
                      color: "#333",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={donation.title}
                  >
                    {donation.title}
                  </h2>
                  <p style={{ margin: "0 0 10px", color: "#666" }}>
                    {donation.description}
                  </p>
                  {filterNearest && donation.distance !== undefined && (
                    <p style={{ margin: "0", color: "#888" }}>
                      {donation.distance.toFixed(1)} km de distância
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>
          Nenhuma doação encontrada.
        </p>
      )}
    </section>
  );
};

export default Donations;
