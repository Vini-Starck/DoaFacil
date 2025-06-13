// ✅ AddDonation.js — UI drasticamente melhorada

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../config/firebase";
import { getDoc, doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";

import { FaRocket, FaArrowRight, FaPlus, FaTrash, FaMapMarkerAlt, FaImage } from "react-icons/fa";

const donationTypes = ["Alimentos", "Brinquedos", "Roupas", "Móveis", "Eletrônicos", "Eletrodomésticos", "Outros"];

const AddDonation = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [donationsLeft, setDonationsLeft] = useState(null);
  const [loading, setLoading] = useState(true);

  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [fields, setFields] = useState([]);
  const [donationType, setDonationType] = useState("Alimentos");
  const [customType, setCustomType] = useState("");

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    localStorage.setItem("addDonationForm", JSON.stringify({
      title, description, locationText, latitude, longitude, fields, donationType, customType
    }));
  }, [title, description, locationText, latitude, longitude, fields, donationType, customType]);

  useEffect(() => {
    if (!fileUpload) return setPreviewUrl("");
    const url = URL.createObjectURL(fileUpload);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fileUpload]);

  useEffect(() => {
    async function fetchUser() {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setDonationsLeft(data.donationsLeft ?? 0);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleSelectPlace = async ({ description }) => {
    setLocationText(description);
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(description)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
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

  const getAddressFromCoords = (lat, lng) => new Promise((resolve, reject) => {
    if (!window.google?.maps?.Geocoder) return reject(new Error("Google Maps Geocoder não está disponível"));
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) resolve(results[0].formatted_address);
      else reject(new Error(`Geocoder falhou: ${status}`));
    });
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
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
    }, err => {
      console.error(err);
      alert("Não foi possível obter localização: " + err.message);
    });
  };

  const addField = () => setFields([...fields, { name: "", value: "" }]);
  const removeField = i => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => setFields(fields.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

  const handleTitleChange = e => e.target.value.length <= 50 && setTitle(e.target.value);
  const handleDescriptionChange = e => e.target.value.length <= 500 && setDescription(e.target.value);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!fileUpload || !latitude || !longitude || !title.trim() || !description.trim() || !locationText.trim()) {
      return alert("Preencha todos os campos obrigatórios.");
    }
    if (donationsLeft <= 0) {
      alert("Você não possui doações restantes. Considere adquirir um plano.");
      return navigate('/plans');
    }
    try {
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
        ...extraObj
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        donationsLeft: donationsLeft - 1
      });

      alert("Doação cadastrada!");
      localStorage.removeItem("addDonationForm");
      navigate("/my-donations");
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar doação.");
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Carregando...</p>;

  if (donationsLeft <= 0) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '1rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      color: '#fff',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '4rem auto'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        <FaRocket />
      </div>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#fff' }}>Limite de doações atingido</h2>
      <p style={{ fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.5', color: '#eee' }}>
        Você esgotou seu limite de doações.<br /> Adquira um novo plano para continuar ajudando!
      </p>
      <button 
        onClick={() => navigate("/plans")}
        style={{
          padding: '0.75rem 2rem',
          background: '#2cc939',
          border: 'none',
          borderRadius: '2rem',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#333',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        Ver Planos <FaArrowRight style={{ marginLeft: '0.5rem' }} />
      </button>
    </div>
  );
}


  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '4rem auto 2rem auto', 
      padding: '2rem', 
      background: '#f9f9f9', 
      borderRadius: '1rem', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      
      <h2 style={{ marginBottom: '1rem', color: '#007bff' }}>Fazer uma Doação</h2>
      <p>Doações restantes: <strong>{donationsLeft}</strong></p>
      <form onSubmit={handleSubmit}>
        <label>Título</label>
        <input value={title} onChange={handleTitleChange} placeholder="Ex.: Cesta Básica" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} />

        <label>Descrição</label>
        <textarea value={description} onChange={handleDescriptionChange} placeholder="Ex.: Contém arroz, feijão..." style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} />

        <label>Tipo</label>
        <select value={donationType} onChange={e => setDonationType(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
          {donationTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {donationType === "Outros" && <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Tipo personalizado" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} />}

        <label>Localização</label>
        <CustomPlacesAutocomplete
          placeholder="Digite seu endereço..."
          value={locationText}
          onChange={setLocationText}
          onSelect={handleSelectPlace}
          inputStyle={{ color: '#000' }}
          suggestionStyle={{ color: '#000', background: '#fff' }}
        />
        <button type="button" onClick={handleGetLocation} style={{ margin: '1rem 0', background: '#28a745', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem' }}><FaMapMarkerAlt /> Usar minha localização</button>

        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input value={f.name} onChange={e => updateField(i, 'name', e.target.value)} placeholder="Nome" />
            <input value={f.value} onChange={e => updateField(i, 'value', e.target.value)} placeholder="Valor" />
            <button type="button" onClick={() => removeField(i)} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '0.25rem' }}><FaTrash /></button>
          </div>
        ))}
        <button type="button" onClick={addField} style={{ marginBottom: '1rem', background: '#007bff', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem' }}><FaPlus /> Adicionar Campo</button>

        <label>Imagem do Item</label>
        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={e => setFileUpload(e.target.files[0])} />
        <button type="button" onClick={() => fileInputRef.current.click()} style={{ marginBottom: '1rem', background: '#17a2b8', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem' }}><FaImage /> Escolher Imagem</button>
        {previewUrl && <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }} />}

        <button type="submit" style={{ background: '#007bff', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.5rem', width: '100%' }}>Cadastrar Doação</button>
      </form>
      
    </div>
);
};

export default AddDonation;
