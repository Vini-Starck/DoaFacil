// src/components/AddDonation.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { db, auth, storage } from "../config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";

const AddDonation = () => {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Localização unificada
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Campos extras e tipo
  const [fields, setFields] = useState([]);
  const [donationType, setDonationType] = useState("Alimentos");
  const [customType, setCustomType] = useState("");

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Restaura do formulário salvo
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
  // Persiste sempre que muda
  useEffect(() => {
    localStorage.setItem(
      "addDonationForm",
      JSON.stringify({ title, description, locationText, latitude, longitude, fields, donationType, customType })
    );
  }, [title, description, locationText, latitude, longitude, fields, donationType, customType]);

  // Preview de imagem
  useEffect(() => {
    if (!fileUpload) return setPreviewUrl("");
    const url = URL.createObjectURL(fileUpload);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileUpload]);

  // Quando o usuário seleciona uma sugestão
  const handleSelectPlace = async ({ description }) => {
    setLocationText(description);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          description
        )}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length) {
        const { lat, lng } = data.results[0].geometry.location;
        setLatitude(lat);
        setLongitude(lng);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  // Reverse geocoding para GPS
  // Função atualizada no seu AddDonation.js
  const getAddressFromCoords = (lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) {
        return reject(new Error("Google Maps Geocoder não está disponível"));
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Geocoder falhou: ${status}`));
        }
      });
    });
  };


  // Botão GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return alert("Seu navegador não suporta geolocalização.");
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const addr = await getAddressFromCoords(lat, lng);
          setLocationText(addr);
        } catch (err) {
          console.error("Geocoding sem resultado legível:", err);
          setLocationText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        }
      },
      (err) => {
        console.error(err);
        alert("Não foi possível obter localização: " + err.message);
      }
    );
  };



  // Campos extras
  const addField = () => setFields([...fields, { name: "", value: "" }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) =>
    setFields(fields.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));

  // Limites de texto
  const handleTitleChange = (e) => e.target.value.length <= 50 && setTitle(e.target.value);
  const handleDescriptionChange = (e) =>
    e.target.value.length <= 500 && setDescription(e.target.value);

  // Envio
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !fileUpload ||
      !latitude ||
      !longitude ||
      !title.trim() ||
      !description.trim() ||
      !locationText.trim()
    ) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    try {
      // Upload imagem
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);

      const extraObj = {};
      fields.forEach(({ name, value }) => name && value && (extraObj[name] = value));
      const finalType = donationType === "Outros" ? customType : donationType;

      await addDoc(collection(db, "donationItems"), {
        title,
        description,
        userId: auth.currentUser.uid,
        imageUrl: `donationImages/${fileUpload.name}`,
        location: locationText,
        latitude,
        longitude,
        donationType: finalType,
        status: "disponível",
        createdAt: serverTimestamp(),
        ...extraObj,
      });

      alert("Doação cadastrada!");
      localStorage.removeItem("addDonationForm");
      navigate("/my-donations");
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar doação.");
    }
  };

  // Estilos simplificados
  const styles = {
    page: { background: "#e9ecef", minHeight: "100vh", padding: 20 },
    container: {
      maxWidth: 600,
      margin: "0 auto",
      padding: 20,
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    label: { marginTop: 15, fontWeight: 500, color: "#6c757d" },
    input: {
      width: "100%",
      padding: 10,
      border: "1px solid #ccc",
      borderRadius: 5,
      marginBottom: 10,
      fontSize: 16,
    },
    button: {
      padding: "10px 15px",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      fontSize: 16,
      marginTop: 10,
    },
    primary: { background: "#28a745", color: "#fff" },
    secondary: { background: "#007bff", color: "#fff" },
    preview: { width: 150, height: 150, objectFit: "cover", margin: "10px auto" },
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.container}>
        <h2>Fazer uma Doação</h2>

        <label style={styles.label}>Título (máx. 50)</label>
        <input style={styles.input} value={title} onChange={handleTitleChange} placeholder="Ex.: Cesta Básica" />

        <label style={styles.label}>Descrição (máx. 500)</label>
        <textarea
          style={styles.input}
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Ex.: Contém arroz, feijão..."
        />

        <label style={styles.label}>Tipo</label>
        <select style={styles.input} value={donationType} onChange={(e) => setDonationType(e.target.value)}>
          {["Alimentos", "Brinquedos", "Roupas", "Móveis", "Eletronicos", "Eletrodomesticos", "Outros"].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {donationType === "Outros" && (
          <input
            style={styles.input}
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Digite tipo personalizado"
          />
        )}

        <label htmlFor="locationText" style={styles.label}>
          Localização
        </label>
        <CustomPlacesAutocomplete
          placeholder="Digite seu endereço..."
          value={locationText}
          onChange={setLocationText}
          onSelect={handleSelectPlace}
        />
        <button
          type="button"
          style={{ ...styles.button, ...styles.secondary }}
          onClick={handleGetLocation}
        >
          Usar minha localização (GPS)
        </button>

        <label style={styles.label}>Campos Extras (opcional)</label>
        {fields.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10 }}>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              value={f.name}
              onChange={(e) => updateField(i, "name", e.target.value)}
              placeholder="Nome"
            />
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              value={f.value}
              onChange={(e) => updateField(i, "value", e.target.value)}
              placeholder="Valor"
            />
            <button type="button" onClick={() => removeField(i)} style={styles.button}>
              🗑️
            </button>
          </div>
        ))}
        <button
          type="button"
          style={{ ...styles.button, ...styles.secondary }}
          onClick={addField}
        >
          + Adicionar Campo
        </button>

        <label style={styles.label}>Imagem do Item</label>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => setFileUpload(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          style={{ ...styles.button, ...styles.secondary }}
        >
          Escolher Imagem
        </button>
        {previewUrl && <img src={previewUrl} alt="Preview" style={styles.preview} />}

        <button type="submit" style={{ ...styles.button, ...styles.primary }}>
          Cadastrar Doação
        </button>
      </form>
    </div>
  );
};

export default AddDonation;
