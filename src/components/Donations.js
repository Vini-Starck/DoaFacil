// src/components/Donations.js
import React from "react";

const Donations = ({ donations, onDonationClick }) => {
  return (
    <section style={{ padding: "20px" }}>
      {donations.length ? (
        <div style={{ display: "grid", gap: "20px", padding: "20px" }}>
          {donations.map((donation) => (
            <div
              key={donation.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "15px",
                borderRadius: "12px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                backgroundColor: "#fff",
                maxWidth: "600px",
                margin: "auto",
                cursor: "pointer",
              }}
              onClick={() => onDonationClick(donation)}
            >
              {donation.imageUrl && (
                <img
                  src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                    donation.imageUrl
                  )}?alt=media`}
                  alt="Imagem do item"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "2px solid #ddd",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 5px", fontSize: "18px", color: "#333" }}>
                  {donation.title}
                </h2>
                <p style={{ margin: "0 0 10px", color: "#666" }}>
                  {donation.description}
                </p>
              </div>
            </div>
          ))}
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
