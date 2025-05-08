// src/components/AddDonation.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

import { db, auth, storage } from "../config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // defina no .env
const libraries = ["places"];

export default function AddDonation() {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Localização e Autocomplete
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Campos extras e tipo da doação
  const [fields, setFields] = useState([]);
  const [donationType, setDonationType] = useState("Alimentos");
  const [customType, setCustomType] = useState("");

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Referência ao Autocomplete
  const autocompleteRef = useRef(null);

  console.log("GOOGLE_API_KEY em runtime:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);

  // Carrega a API de forma assíncrona
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  // Persistência com localStorage (opcional)
  useEffect(() => {
    const saved = localStorage.getItem("addDonationForm");
    if (saved) {
      const p = JSON.parse(saved);
      setTitle(p.title || "");
      setDescription(p.description || "");
      setLocationText(p.locationText || "");
      setLatitude(p.latitude || null);
      setLongitude(p.longitude || null);
      setFields(p.fields || []);
      setDonationType(p.donationType || "Alimentos");
      setCustomType(p.customType || "");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "addDonationForm",
      JSON.stringify({
        title,
        description,
        locationText,
        latitude,
        longitude,
        fields,
        donationType,
        customType,
      })
    );
  }, [title, description, locationText, latitude, longitude, fields, donationType, customType]);

  // Preview da imagem
  useEffect(() => {
    if (!fileUpload) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(fileUpload);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileUpload]);

  // Quando o Autocomplete carrega
  const onLoadAutocomplete = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  // Ao escolher um lugar
  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry) {
      console.warn("Autocomplete: sem geometria disponível");
      return;
    }
    setLocationText(place.formatted_address || "");
    setLatitude(place.geometry.location.lat());
    setLongitude(place.geometry.location.lng());
  };

  // Geolocalização via navegador
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        // reverse geocode
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_API_KEY}`
        );
        const data = await res.json();
        if (data.results[0]) setLocationText(data.results[0].formatted_address);
      },
      (err) => {
        console.error(err);
        alert("Não foi possível obter localização.");
      }
    );
  };

  // Campos extras
  const addField = () => setFields([...fields, { name: "", value: "" }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => {
    const copy = [...fields];
    copy[i][key] = val.slice(0, 15);
    setFields(copy);
  };

  // Validação de título/descrição
  const handleTitleChange = (e) => e.target.value.length <= 50 && setTitle(e.target.value);
  const handleDescriptionChange = (e) =>
    e.target.value.length <= 500 && setDescription(e.target.value);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUpload) return alert("Selecione uma imagem.");
    if (!latitude || !longitude) return alert("Informe localização.");
    if (!title || !description || !locationText) return alert("Preencha todos os campos.");

    try {
      // upload
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);

      // extraFields
      const extras = {};
      fields.forEach((f) => f.name && f.value && (extras[f.name] = f.value));

      await addDoc(collection(db, "donationItems"), {
        title,
        description,
        userId: auth.currentUser.uid,
        imageUrl: `donationImages/${fileUpload.name}`,
        location: locationText,
        latitude,
        longitude,
        donationType: donationType === "Outros" ? customType : donationType,
        status: "disponível",
        createdAt: serverTimestamp(),
        ...extras,
      });

      alert("Doação cadastrada!");
      navigate("/my-donations");
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar.");
    }
  };

  // Estilos (mantidos do seu original)
  const pageBackgroundStyle = { backgroundColor: "#e9ecef", minHeight: "100vh", padding: "30px 0" };
  const containerStyle = {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };
  const formStyle = { display: "flex", flexDirection: "column" };
  const labelStyle = { marginBottom: 5, fontWeight: 500, color: "#6c757d" };
  const inputStyle = {
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 5,
    width: "100%",
    marginBottom: 15,
    fontSize: 16,
    outline: "none",
  };
  const textareaStyle = { ...inputStyle, minHeight: 80, resize: "vertical" };
  const buttonStyle = { padding: "10px 15px", border: "none", borderRadius: 5, cursor: "pointer" };
  const primary = { ...buttonStyle, backgroundColor: "#28a745", color: "#fff" };
  const secondary = { ...buttonStyle, backgroundColor: "#007bff", color: "#fff" };

  if (loadError) return <p>Erro ao carregar autocomplete.</p>;
  if (!isLoaded) return <p>Carregando autocomplete...</p>;

  return (
    <div style={pageBackgroundStyle}>
      <div style={containerStyle}>
        <h2 style={{ textAlign: "center", marginBottom: 20, color: "#343a40" }}>Fazer uma Doação</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Título */}
          <label style={labelStyle}>Título (máx. 50)</label>
          <input value={title} onChange={handleTitleChange} style={inputStyle} placeholder="Ex.: Cesta Básica" />

          {/* Descrição */}
          <label style={labelStyle}>Descrição (máx. 500)</label>
          <textarea
            value={description}
            onChange={handleDescriptionChange}
            style={textareaStyle}
            placeholder="Ex.: Contém arroz, feijão..."
          />

          {/* Tipo */}
          <label style={labelStyle}>Tipo da Doação</label>
          <select
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
            style={inputStyle}
          >
            {["Alimentos", "Brinquedos", "Roupas", "Móveis", "Eletronicos", "Eletrodomesticos", "Outros"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {donationType === "Outros" && (
            <input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              style={inputStyle}
              placeholder="Ex.: Produtos de higiene"
            />
          )}

          {/* Autocomplete Google */}
          <label style={labelStyle}>Localização</label>
          <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Digite seu endereço..."
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              style={inputStyle}
            />
          </Autocomplete>

          <button type="button" onClick={handleGetLocation} style={secondary}>
            Usar minha localização (GPS)
          </button>

          {/* Campos extras */}
          <label style={labelStyle}>Campos Extras (opcional)</label>
          {fields.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input
                placeholder="Nome"
                value={f.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <input
                placeholder="Valor"
                value={f.value}
                onChange={(e) => updateField(i, "value", e.target.value)}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button type="button" onClick={() => removeField(i)} style={secondary}>
                🗑️
              </button>
            </div>
          ))}
          <button type="button" onClick={addField} style={secondary}>
            + Adicionar Campo
          </button>

          {/* Imagem */}
          <label style={labelStyle}>Imagem do Item</label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => setFileUpload(e.target.files[0])}
          />
          <button type="button" onClick={() => fileInputRef.current.click()} style={secondary}>
            Escolher Imagem
          </button>
          {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: 150, borderRadius: 5, margin: "10px 0" }} />}

          {/* Submit */}
          <button type="submit" style={primary}>
            Cadastrar Doação
          </button>
        </form>
      </div>
    </div>
  );
}
