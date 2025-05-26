import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../config/firebase";
import {
  getDoc,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";
import AdSense from "./AdSense";

const donationTypes = [
  "Alimentos",
  "Brinquedos",
  "Roupas",
  "Móveis",
  "Eletrônicos",
  "Eletrodomésticos",
  "Outros",
];

const MAX_DONATIONS = 5;

const AddDonation = () => {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPremium, setIsPremium] = useState(false);

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

  // Verifica se usuário é premium
  useEffect(() => {
    async function fetchUser() {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) setIsPremium(!!snap.data().isPremium);
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
    try {
      // Upload imagem
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);

      const extraObj = {};
      fields.forEach(
        ({ name, value }) => name && value && (extraObj[name] = value)
      );
      const finalType = donationType === "Outros" ? customType : donationType;

      if (!isPremium) {
        const q = query(
          collection(db, "donationItems"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count >= MAX_DONATIONS) {
          alert("Você atingiu o limite de doações cadastradas.");
          return;
        }
      }

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
    page: {
      background: "linear-gradient(135deg, #28a745 0%, #007bff 100%)",
      minHeight: "100vh",
      padding: "0 0 40px 0",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
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
  };

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
        <h2 style={{ color: "#28a745", marginBottom: 18, fontWeight: "bold" }}>
          Fazer uma Doação
        </h2>

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
        {!isPremium && (
          <div style={styles.limitMsg}>
            Limite de doações para contas gratuitas: {MAX_DONATIONS}
          </div>
        )}
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