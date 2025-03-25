// src/components/AddDonation.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

// Função para geocodificar um endereço usando Nominatim (OpenStreetMap)
const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Erro ao geocodificar endereço:", error);
  }
  return null;
};

const AddDonation = () => {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Localização (texto) + coordenadas
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Campos dinâmicos
  const [fields, setFields] = useState([]);

  const navigate = useNavigate();

  // Persistência com localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("addDonationForm");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTitle(parsed.title || "");
      setDescription(parsed.description || "");
      setLocationText(parsed.locationText || "");
      setLatitude(parsed.latitude || null);
      setLongitude(parsed.longitude || null);
      setFields(parsed.fields || []);
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      title,
      description,
      locationText,
      latitude,
      longitude,
      fields,
    };
    localStorage.setItem("addDonationForm", JSON.stringify(dataToSave));
  }, [title, description, locationText, latitude, longitude, fields]);

  // Preview da imagem
  useEffect(() => {
    if (!fileUpload) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(fileUpload);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [fileUpload]);

  // Adicionar e remover campos dinâmicos
  const addField = () => {
    setFields([...fields, { name: "", value: "" }]);
  };

  const removeField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const updateFieldName = (index, newName) => {
    if (newName.length > 15) return; // Limite de 15 caracteres
    const updated = [...fields];
    updated[index].name = newName;
    setFields(updated);
  };

  const updateFieldValue = (index, newValue) => {
    if (newValue.length > 15) return; // Limite de 15 caracteres
    const updated = [...fields];
    updated[index].value = newValue;
    setFields(updated);
  };

  // Obter localização via GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationText(
          `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`
        );
      },
      (error) => {
        alert("Não foi possível obter a localização: " + error.message);
      }
    );
  };

  // Limites de caracteres para título e descrição
  const handleTitleChange = (e) => {
    if (e.target.value.length <= 50) {
      setTitle(e.target.value);
    }
  };

  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= 500) {
      setDescription(e.target.value);
    }
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUpload) {
      alert("Por favor, selecione uma imagem antes de cadastrar a doação.");
      return;
    }
    // Se as coordenadas não foram definidas (via GPS) mas o usuário digitou um endereço, geocodifica
    if ((!latitude || !longitude) && locationText) {
      const coords = await geocodeAddress(locationText);
      if (coords) {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      } else {
        alert("Não foi possível obter a localização a partir do endereço fornecido.");
        return;
      }
    }
    // Se ainda não houver coordenadas, alerta o usuário
    if (!latitude || !longitude) {
      alert("Por favor, informe sua localização, usando GPS ou digitando seu endereço.");
      return;
    }

    try {
      // Upload da imagem
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);

      // Monta os campos extras
      const extraFields = {};
      fields.forEach((field) => {
        if (field.name && field.value) {
          extraFields[field.name] = field.value;
        }
      });

      // Adiciona o item no Firestore com data/hora de criação
      await addDoc(collection(db, "donationItems"), {
        title,
        description,
        userId: auth?.currentUser?.uid,
        imageUrl: `donationImages/${fileUpload.name}`,
        location: locationText,
        latitude,
        longitude,
        createdAt: serverTimestamp(),
        ...extraFields,
      });

      // Limpa o formulário e remove os dados do localStorage
      setTitle("");
      setDescription("");
      setFileUpload(null);
      setPreviewUrl("");
      setLocationText("");
      setLatitude(null);
      setLongitude(null);
      setFields([]);
      localStorage.removeItem("addDonationForm");

      // Redireciona para a lista de doações (rota "/")
      navigate("/");
    } catch (error) {
      console.error("Erro ao cadastrar a doação:", error);
      alert("Ocorreu um erro ao cadastrar a doação.");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h2>Fazer uma Doação</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          alignItems: "center",
        }}
      >
        {/* Título */}
        <input
          placeholder="Título do Item (máx. 50 caracteres)"
          value={title}
          onChange={handleTitleChange}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            width: "100%",
            maxWidth: "500px",
          }}
        />

        {/* Descrição */}
        <textarea
          placeholder="Descrição do Item (máx. 500 caracteres)"
          value={description}
          onChange={handleDescriptionChange}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            width: "100%",
            maxWidth: "500px",
            minHeight: "80px",
          }}
        />

        {/* Localização */}
        <div style={{ width: "100%", maxWidth: "500px" }}>
          <input
            placeholder="Digite seu endereço ou local..."
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "5px",
              width: "100%",
              marginBottom: "5px",
            }}
          />
          <button
            type="button"
            onClick={handleGetLocation}
            style={{
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Usar minha localização (GPS)
          </button>
        </div>

        {/* Campos dinâmicos */}
        {fields.map((field, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "10px",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <input
              placeholder="Nome do Campo (ex: Peso)"
              value={field.name}
              onChange={(e) => updateFieldName(index, e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
            <input
              placeholder="Valor (ex: 10kg)"
              value={field.value}
              onChange={(e) => updateFieldValue(index, e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
            <button
              type="button"
              onClick={() => removeField(index)}
              style={{
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                padding: "8px",
                cursor: "pointer",
              }}
            >
              🗑️
            </button>
          </div>
        ))}

        {/* Botão para adicionar novo campo */}
        <button
          type="button"
          onClick={addField}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "10px 15px",
            cursor: "pointer",
          }}
        >
          + Adicionar Campo
        </button>

        {/* Upload de imagem */}
        <input
          type="file"
          onChange={(e) => setFileUpload(e.target.files[0])}
          style={{ margin: "10px 0" }}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: "150px",
              height: "150px",
              objectFit: "cover",
              borderRadius: "5px",
              marginBottom: "10px",
            }}
          />
        )}

        {/* Botão de submit */}
        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Cadastrar Doação
        </button>
      </form>
    </div>
  );
};

export default AddDonation;
