// src/components/EditDonation.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../config/firebase";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";
import AdSense from './AdSense';

const EditDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [existingImagePath, setExistingImagePath] = useState("");

  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [fields, setFields] = useState([]);
  const [donationType, setDonationType] = useState("Alimentos");
  const [customType, setCustomType] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchDonation() {
      const docRef = doc(db, "donationItems", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title);
        setDescription(data.description);
        setLocationText(data.location);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setFields(
          Object.entries(data)
            .filter(([k]) => !["title","description","location","latitude","longitude","imageUrl","donationType","userId","status","createdAt", "updatedAt"].includes(k))
            .map(([k,v]) => ({ name: k, value: v }))
        );
        setDonationType(
          ["Alimentos","Brinquedos","Roupas","Móveis","Eletronicos","Eletrodomesticos"].includes(data.donationType)
          ? data.donationType
          : "Outros"
        );
        if (!["Alimentos","Brinquedos","Roupas","Móveis","Eletronicos","Eletrodomesticos"].includes(data.donationType)) {
          setCustomType(data.donationType);
        }
        setExistingImagePath(data.imageUrl);
        setPreviewUrl(
          `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(data.imageUrl)}?alt=media`
        );
      }
    }
    fetchDonation();
  }, [id]);

  useEffect(() => {
    if (!fileUpload) return;
    const url = URL.createObjectURL(fileUpload);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileUpload]);

  const handleSelectPlace = async ({ description }) => {
    setLocationText(description);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(description)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length) {
        const { lat, lng } = data.results[0].geometry.location;
        setLatitude(lat);
        setLongitude(lng);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLatitude(lat);
        setLongitude(lng);
        if (window.google?.maps?.Geocoder) {
          new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) setLocationText(results[0].formatted_address);
            else setLocationText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
          });
        } else {
          setLocationText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        }
      },
      err => alert("Não foi possível obter localização: " + err.message)
    );
  };

  const addField = () => setFields([...fields, { name: "", value: "" }]);
  const removeField = i => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) =>
    setFields(fields.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));

  const handleTitleChange = e => e.target.value.length <= 50 && setTitle(e.target.value);
  const handleDescriptionChange = e => e.target.value.length <= 500 && setDescription(e.target.value);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !locationText || !latitude || !longitude) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    try {
      let imagePath = existingImagePath;
      if (fileUpload) {
        if (existingImagePath) await deleteObject(ref(storage, existingImagePath));
        const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
        await uploadBytes(fileRef, fileUpload);
        imagePath = `donationImages/${fileUpload.name}`;
      }
      const extraObj = {};
      fields.forEach(({ name, value }) => name && value && (extraObj[name] = value));
      const finalType = donationType === "Outros" ? customType : donationType;
      await updateDoc(doc(db, "donationItems", id), {
        title,
        description,
        location: locationText,
        latitude,
        longitude,
        imageUrl: imagePath,
        donationType: finalType,
        ...extraObj
      });
      alert("Doação atualizada!");
      navigate("/my-donations");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar doação.");
    }
  };

  const styles = {
    page: { background: "#e9ecef", minHeight: "100vh", padding: 20 },
    container: { maxWidth: 600, margin: "0 auto", padding: 20, background: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
    label: { marginTop: 15, fontWeight: 500, color: "#6c757d" },
    input: { width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 5, marginBottom: 10, fontSize: 16 },
    button: { padding: "10px 15px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 16, marginTop: 10 },
    primary: { background: "#28a745", color: "#fff" },
    secondary: { background: "#007bff", color: "#fff" },
    preview: { width: 150, height: 150, objectFit: "cover", margin: "10px auto" }
  };

  return (
    <div style={styles.page}>
      {/* AdSense acima do formulário */}
    <div style={{ margin: "0 auto 24px", maxWidth: 320 }}>
      <AdSense
        adSlot="4451812486"
        style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
      />
    </div>
      <form onSubmit={handleSubmit} style={styles.container}>
        <h2>Editar Doação</h2>
        <label style={styles.label}>Título (máx. 50)</label>
        <input style={styles.input} value={title} onChange={handleTitleChange} />
        <label style={styles.label}>Descrição (máx. 500)</label>
        <textarea style={styles.input} value={description} onChange={handleDescriptionChange} />
        <label style={styles.label}>Tipo</label>
        <select style={styles.input} value={donationType} onChange={e => setDonationType(e.target.value)}>
          {["Alimentos","Brinquedos","Roupas","Móveis","Eletronicos","Eletrodomesticos","Outros"].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {donationType === "Outros" && (
          <input style={styles.input} value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Tipo personalizado" />
        )}
        <label style={styles.label}>Localização</label>
        <CustomPlacesAutocomplete placeholder="Digite seu endereço..." value={locationText} onChange={setLocationText} onSelect={handleSelectPlace} />
        <button type="button" style={{ ...styles.button, ...styles.secondary }} onClick={handleGetLocation}>
          Usar minha localização
        </button>
        <label style={styles.label}>Campos Extras (opcional)</label>
        {fields.map((f,i) => (
          <div key={i} style={{ display: "flex", gap: 10 }}>
            <input style={{ ...styles.input, marginBottom:0 }} value={f.name} onChange={e => updateField(i,'name',e.target.value)} placeholder="Nome" />
            <input style={{ ...styles.input, marginBottom:0 }} value={f.value} onChange={e => updateField(i,'value',e.target.value)} placeholder="Valor" />
            <button type="button" onClick={() => removeField(i)} style={styles.button}>🗑️</button>
          </div>
        ))}
        <button type="button" onClick={addField} style={{ ...styles.button, ...styles.secondary }}>+ Adicionar Campo</button>
        <label style={styles.label}>Imagem do Item</label>
        <input type="file" ref={fileInputRef} style={{ display:"none" }} onChange={e => setFileUpload(e.target.files[0])} />
        <button type="button" onClick={() => fileInputRef.current.click()} style={{ ...styles.button, ...styles.secondary }}>
          Escolher Imagem
        </button>
        {previewUrl && <img src={previewUrl} alt="Preview" style={styles.preview} />}
        <button type="submit" style={{ ...styles.button, ...styles.primary }}>
          Salvar Alterações
        </button>
      </form>
      {/* AdSense abaixo do formulário */}
    <div style={{ margin: "24px auto 0", maxWidth: 320 }}>
      <AdSense
        adSlot="4451812486"
        style={{ display: 'block', margin: '0 auto', maxWidth: '320px' }}
      />
    </div>
    </div>
  );
};

export default EditDonation;
