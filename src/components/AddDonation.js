import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../config/firebase";
import {
  getDoc,
  doc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";
import AdSense from "./AdSense";
import { FaRocket, FaArrowRight } from "react-icons/fa"; // Impressão alienígena

const donationTypes = [
  "Alimentos",
  "Brinquedos",
  "Roupas",
  "Móveis",
  "Eletrônicos",
  "Eletrodomésticos",
  "Outros",
];

const AddDonation = () => {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [donationsLeft, setDonationsLeft] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [
    title,
    description,
    locationText,
    latitude,
    longitude,
    fields,
    donationType,
    customType,
  ]);

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
  const handleTitleChange = (e) =>
    e.target.value.length <= 50 && setTitle(e.target.value);
  const handleDescriptionChange = (e) =>
    e.target.value.length <= 500 && setDescription(e.target.value);

  // Verifica se usuário é premium e busca donationsLeft
  useEffect(() => {
    async function fetchUser() {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setIsPremium(!!data.isPremium);
        setDonationsLeft(data.donationsLeft ?? 0);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

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
    if (!isPremium && donationsLeft <= 0) {
      alert("Você não possui doações restantes. Considere adquirir um plano.");
      return navigate('/plans');
    }
    try {
      // Upload imagem
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);

      const extraObj = {};
      fields.forEach(
        ({ name, value }) => name && value && (extraObj[name] = value)
      );
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

  // Estilos harmonizados com o restante do app
  const styles = {
    
    container: {
      maxWidth: 520,
      margin: "0 auto",
      padding: "36px 28px 28px 28px",
      background: "rgba(255,255,255,0.97)",
      borderRadius: 16,
      boxShadow: "0 8px 32px rgba(40, 167, 69, 0.10), 0 1.5px 8px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    label: {
      marginTop: 18,
      fontWeight: 500,
      color: "#28a745",
      fontSize: 16,
      alignSelf: "flex-start",
    },
    input: {
      width: "100%",
      padding: 12,
      border: "1.5px solid #e0e0e0",
      borderRadius: 8,
      marginBottom: 10,
      fontSize: 16,
      background: "#fafbfc",
      outline: "none",
      transition: "border 0.2s",
    },
    textarea: {
      width: "100%",
      padding: 12,
      border: "1.5px solid #e0e0e0",
      borderRadius: 8,
      marginBottom: 10,
      fontSize: 16,
      background: "#fafbfc",
      outline: "none",
      minHeight: 70,
      resize: "vertical",
      transition: "border 0.2s",
    },
    button: {
      padding: "12px 24px",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 17,
      marginTop: 12,
      fontWeight: "bold",
      background: "linear-gradient(90deg, #28a745 60%, #007bff 100%)",
      color: "#fff",
      boxShadow: "0 2px 8px rgba(40,167,69,0.10)",
      transition: "background 0.2s, box-shadow 0.2s",
      letterSpacing: 0.5,
    },
    secondary: {
      background: "linear-gradient(90deg, #007bff 60%, #28a745 100%)",
      color: "#fff",
    },
    preview: {
      width: 170,
      height: 170,
      objectFit: "cover",
      margin: "10px auto",
      borderRadius: 10,
      border: "2px solid #dbdbdb",
      background: "#fafbfc",
      display: "block",
    },
    extraFields: {
      width: "100%",
      marginBottom: 10,
    },
    fieldRow: {
      display: "flex",
      gap: 10,
      marginBottom: 8,
    },
    removeBtn: {
      background: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "0 10px",
      fontSize: 18,
      cursor: "pointer",
      marginLeft: 4,
      height: 40,
      alignSelf: "center",
    },
    limitMsg: {
      color: "#888",
      fontSize: 13,
      textAlign: "center",
      marginTop: 10,
      marginBottom: -8,
    },
    headerRow: {
      width: "100%",
      display: "common",
     
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    headerText: {
      color: "#28a745",
      fontWeight: "bold",
      fontSize: 24,
    },
    headerCount: {
      color: "#bf1b1b",
      fontSize: 14,
    },
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
    },
    cosmicContainer: {
      background: "rgba(37, 33, 100, 0.39)",
      borderRadius: 16,
      padding: 32,
      textAlign: "center",
      boxShadow: "0 0 20px rgba(136, 201, 165, 0.36)",
      backdropFilter: "blur(10px)",
      maxWidth: 450,
      margin: "0 auto",
    },
    header: {
      fontSize: 22,
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      animation: "float 3s ease-in-out infinite",
    },
    icon: {
      animation: "spin 4s linear infinite",
    },
    message: {
      fontSize: 18,
      margin: "16px 0",
      lineHeight: 1.4,
    },
    planButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 24px",
      background: "#00ffe7",
      border: "none",
      borderRadius: 8,
      color: "#020024",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    planButtonHover: {
      transform: "scale(1.05)",
      boxShadow: "0 6px 20px rgba(0, 255, 231, 0.5)",
    },
    '@keyframes float': {
      '0%,100%': { transform: 'translateY(0)' },
      '50%':   { transform: 'translateY(-10px)' },
    },
    '@keyframes spin': {
      '0%':   { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  };

  if (loading) return null;

  // Se sem doações restantes
  if (donationsLeft <= 0) {
    return (
      <div style={styles.page}>
        <div style={styles.cosmicContainer}>
          <h2 style={styles.header}>
            <FaRocket style={styles.icon} size={28} />
            Ops! suas doações acabaram!
          </h2>
          <p style={styles.message}>
            Você esgotou seu limite de doações.<br />
            Abasteça sua conta com novos planos para continuar explorando e ajudando quem precisa!
          </p>
          <button
            style={styles.planButton}
            onClick={() => navigate("/plans")}
            onMouseEnter={e => Object.assign(e.currentTarget.style, styles.planButtonHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: '', boxShadow: '' })}
          >
            Ver Planos <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* AdSense acima do formulário */}
      <div style={{ margin: "0 auto 24px", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: "block", margin: "0 auto", maxWidth: "320px" }}
        />
      </div>
      <form onSubmit={handleSubmit} style={styles.container}>
        <div style={styles.headerRow}>
          <h2 style={styles.headerText}>Fazer uma Doação</h2>
          <h3 style={styles.headerCount}>Doações restantes: {donationsLeft}</h3>
          
        </div>

        <label style={styles.label}>Título (máx. 50)</label>
        <input
          style={styles.input}
          value={title}
          onChange={handleTitleChange}
          placeholder="Ex.: Cesta Básica"
          maxLength={50}
          required
        />

        <label style={styles.label}>Descrição (máx. 500)</label>
        <textarea
          style={styles.textarea}
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Ex.: Contém arroz, feijão..."
          maxLength={500}
          required
        />

        <label style={styles.label}>Tipo</label>
        <select
          style={styles.input}
          value={donationType}
          onChange={(e) => setDonationType(e.target.value)}
        >
          {donationTypes.map((opt) => (
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
            required
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
        <div style={styles.extraFields}>
          {fields.map((f, i) => (
            <div key={i} style={styles.fieldRow}>
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
              <button
                type="button"
                onClick={() => removeField(i)}
                style={styles.removeBtn}
                title="Remover campo"
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            type="button"
            style={{ ...styles.button, ...styles.secondary, marginTop: 0 }}
            onClick={addField}
          >
            + Adicionar Campo
          </button>
        </div>

        <label style={styles.label}>Imagem do Item</label>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={(e) => setFileUpload(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          style={{ ...styles.button, ...styles.secondary }}
        >
          Escolher Imagem
        </button>
        {previewUrl && (
          <img src={previewUrl} alt="Preview" style={styles.preview} />
        )}

        <button type="submit" style={styles.button}>
          Cadastrar Doação
        </button>
      </form>
      {/* AdSense abaixo do formulário */}
      <div style={{ margin: "24px auto 0", maxWidth: 320 }}>
        <AdSense
          adSlot="4451812486"
          style={{ display: "block", margin: "0 auto", maxWidth: "320px" }}
        />
      </div>
    </div>
  );
};

export default AddDonation;
