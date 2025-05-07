// src/components/MyDonations.js
import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

// HoverButton permanece inalterado
const HoverButton = ({ baseStyle, hoverStyle, onClick, children }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...baseStyle, ...(hover ? hoverStyle : {}) }}
    >
      {children}
    </button>
  );
};

const MyDonations = () => {
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    // Listen all donationItems, filter client-side
    const unsub = onSnapshot(collection(db, "donationItems"), snap =>
      setDonations(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(
            d =>
              d.userId === currentUser.uid ||
              d.beneficiary === currentUser.uid
          )
      )
    );
    return unsub;
  }, [currentUser]);

  const handleEdit = d => navigate(`/edit-donation/${d.id}`);
  const handleDelete = async id => {
    if (!window.confirm("Excluir esta doação?")) return;
    try {
      await deleteDoc(doc(db, "donationItems", id));
      alert("Doação excluída.");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir.");
    }
  };
  const handleConclude = async id => {
    if (!window.confirm("Concluir esta doação?")) return;
    try {
      await updateDoc(doc(db, "donationItems", id), { status: "concluido" });
      alert("Doação concluída.");
    } catch (e) {
      console.error(e);
      alert("Erro ao concluir.");
    }
  };

  // Derivações de arrays
  const ownActive = donations.filter(
    d => d.userId === currentUser.uid && !["em andamento", "concluido"].includes(d.status)
  );
  const inProgress = donations.filter(
    d => d.status === "em andamento"
  );
  const concluded = donations.filter(
    d => d.status === "concluido"
  );

  // estilos seguem iguais
  const container = { padding: 20 };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))",
    gap: 20,
    margin: "0 auto",
    maxWidth: 1200,
  };
  const cardBase = {
    display: "flex",
    flexDirection: "column",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
    transition: "transform .2s, box-shadow .2s",
  };
  const infoStyle = { display: "flex", alignItems: "center", gap: 15, marginBottom: 10 };
  const imgStyle = { width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "2px solid #ddd" };
  const details = { flex: 1 };
  const title = { margin: "0 0 5px", fontSize: 18, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const desc = { margin: "0 0 10px", color: "#666" };
  const btnGroup = { display: "flex", gap: 10, justifyContent: "center" };
  const baseBtn = { padding: "8px 12px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14 };
  const editBtn = { ...baseBtn, backgroundColor: "#007bff", color: "#fff" };
  const delBtn = { ...baseBtn, backgroundColor: "#dc3545", color: "#fff" };
  const conclBtn = { ...baseBtn, backgroundColor: "#28a745", color: "#fff" };
  const hoverEdit = { backgroundColor: "#0056b3" };
  const hoverDel = { backgroundColor: "#b02a37" };
  const hoverConcl = { backgroundColor: "#1e7e34" };

  return (
    <section style={container}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Minhas Doações Ativas</h2>
      {ownActive.length ? (
        <div style={grid}>
          {ownActive.map(d => {
            const hovered = hoveredId === d.id;
            return (
              <div
                key={d.id}
                style={{
                  ...cardBase,
                  boxShadow: hovered ? "0 6px 12px rgba(0,0,0,.2)" : "0 4px 8px rgba(0,0,0,.1)",
                  transform: hovered ? "scale(1.02)" : "scale(1)",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ ...infoStyle }} onClick={() => handleEdit(d)}>
                  {d.imageUrl && (
                    <img
                      src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                        d.imageUrl
                      )}?alt=media`}
                      alt=""
                      style={imgStyle}
                    />
                  )}
                  <div style={details}>
                    <h3 style={title} title={d.title}>{d.title}</h3>
                    <p style={desc}>{d.description}</p>
                  </div>
                </div>
                <div style={btnGroup}>
                  <HoverButton baseStyle={editBtn} hoverStyle={hoverEdit} onClick={() => handleEdit(d)}>
                    Editar
                  </HoverButton>
                  <HoverButton baseStyle={delBtn} hoverStyle={hoverDel} onClick={() => handleDelete(d.id)}>
                    Excluir
                  </HoverButton>
                  <HoverButton baseStyle={conclBtn} hoverStyle={hoverConcl} onClick={() => handleConclude(d.id)}>
                    Concluir
                  </HoverButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação ativa.</p>
      )}

      <h2 style={{ textAlign: "center", margin: "40px 0 20px" }}>Doações Em Andamento</h2>
      {inProgress.length ? (
        <div style={grid}>
          {inProgress.map(d => {
            const hovered = hoveredId === d.id;
            const amOwner = d.userId === currentUser.uid;
            return (
              <div
                key={d.id}
                style={{
                  ...cardBase,
                  boxShadow: hovered ? "0 6px 12px rgba(0,0,0,.2)" : "0 4px 8px rgba(0,0,0,.1)",
                  transform: hovered ? "scale(1.02)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={infoStyle}>
                  {d.imageUrl && (
                    <img
                      src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                        d.imageUrl
                      )}?alt=media`}
                      alt=""
                      style={imgStyle}
                    />
                  )}
                  <div style={details}>
                    <h3 style={title} title={d.title}>{d.title}</h3>
                    <p style={desc}>{d.description}</p>
                    <p style={{ fontStyle: "italic", color: "#888" }}>
                      {amOwner
                        ? "Você está doando em andamento"
                        : "Você é beneficiário"}
                    </p>
                  </div>
                </div>
                {amOwner && (
                  <div style={btnGroup}>
                    <HoverButton baseStyle={conclBtn} hoverStyle={hoverConcl} onClick={() => handleConclude(d.id)}>
                      Concluir
                    </HoverButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação em andamento.</p>
      )}

      <h2 style={{ textAlign: "center", margin: "40px 0 20px" }}>Doações Concluídas</h2>
      {concluded.length ? (
        <div style={grid}>
          {concluded.map(d => (
            <div
              key={d.id}
              style={{
                ...cardBase,
                boxShadow: "0 4px 8px rgba(0,0,0,.1)",
                cursor: "default",
              }}
            >
              <div style={infoStyle}>
                {d.imageUrl && (
                  <img
                    src={`https://firebasestorage.googleapis.com/v0/b/doafacil-ab7e4.firebasestorage.app/o/${encodeURIComponent(
                      d.imageUrl
                    )}?alt=media`}
                    alt=""
                    style={imgStyle}
                  />
                )}
                <div style={details}>
                  <h3 style={title} title={d.title}>{d.title}</h3>
                  <p style={desc}>{d.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666" }}>Nenhuma doação concluída.</p>
      )}
    </section>
  );
};

export default MyDonations;
