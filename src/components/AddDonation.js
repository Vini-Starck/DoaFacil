// src/components/AddDonation.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { db, auth, storage } from "../config/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
// Se você já criou um componente customizado para sugestões, use-o. Caso contrário, podemos usar o GooglePlacesAutocomplete.
import CustomPlacesAutocomplete from "./CustomPlacesAutocomplete";

const AddDonation = () => {
  // Estados principais
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUpload, setFileUpload] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Localização e Autocomplete
  const [locationValue, setLocationValue] = useState(null);
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Campos extras e tipo da doação
  const [fields, setFields] = useState([]);
  const [donationType, setDonationType] = useState("Alimentos");
  const [customType, setCustomType] = useState("");

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Persistência com localStorage (opcional)
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
      setDonationType(parsed.donationType || "Alimentos");
      setCustomType(parsed.customType || "");
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
      donationType,
      customType,
    };
    localStorage.setItem("addDonationForm", JSON.stringify(dataToSave));
  }, [title, description, locationText, latitude, longitude, fields, donationType, customType]);

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

  // Quando o usuário seleciona um endereço via autocomplete
  const handleSelectPlace = async (value) => {
    if (!value || !value.description) {
        console.warn("handleSelectPlace - valor inválido ou não definido:", value);
        return;
    }

    console.log("handleSelectPlace - valor selecionado:", value);

    // Atualiza o valor do campo de localização
    setLocationValue(value);
    setLocationText(value.description);

    console.log("handleSelectPlace - locationText atualizado para:", value.description);

    try {
        // Busca as coordenadas do endereço usando a API de Geocodificação do Google
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(value.description)}&key=AIzaSyDmkiXWowTV3HqXJF9sQFIrpImFOxC3lGA`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            setLatitude(location.lat);
            setLongitude(location.lng);
            console.log("handleSelectPlace - Coordenadas obtidas:", location.lat, location.lng);
        } else {
            console.warn("handleSelectPlace - Não foi possível obter coordenadas. Status:", data.status);
        }
    } catch (error) {
        console.error("handleSelectPlace - Erro ao buscar coordenadas:", error);
    }
};



  // Função para converter coordenadas em endereço usando a API de Geocoding do Google
  const getAddressFromCoords = async (lat, lng) => {
    console.log("getAddressFromCoords - coordenadas recebidas:", lat, lng);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDmkiXWowTV3HqXJF9sQFIrpImFOxC3lGA`
      );
      const data = await response.json();
      console.log("getAddressFromCoords - resposta da API:", data);
      if (data.status === "OK" && data.results.length > 0) {
        console.log("getAddressFromCoords - endereço encontrado:", data.results[0].formatted_address);
        return data.results[0].formatted_address;
      } else {
        console.warn("getAddressFromCoords - nenhum resultado. Status:", data.status);
      }
    } catch (error) {
      console.error("Erro na geocodificação reversa:", error);
    }
    return null;
  };

  // Obter localização via GPS e realizar reverse geocoding
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log("handleGetLocation - posição obtida:", lat, lng);
        setLatitude(lat);
        setLongitude(lng);
        const address = await getAddressFromCoords(lat, lng);
        if (address) {
          console.log("handleGetLocation - endereço obtido:", address);
          setLocationText(address);
        } else {
          console.warn("handleGetLocation - não foi possível obter endereço via API. Usando coordenadas.");
          setLocationText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        }
      },
      (error) => {
        console.error("handleGetLocation - erro ao obter localização:", error);
        alert("Não foi possível obter a localização: " + error.message);
      }
    );
  };

  // Funções para campos extras
  const addField = () => setFields([...fields, { name: "", value: "" }]);
  const removeField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };
  const updateFieldName = (index, newName) => {
    if (newName.length > 15) return;
    const updated = [...fields];
    updated[index].name = newName;
    setFields(updated);
  };
  const updateFieldValue = (index, newValue) => {
    if (newValue.length > 15) return;
    const updated = [...fields];
    updated[index].value = newValue;
    setFields(updated);
  };

  // Limite para título e descrição
  const handleTitleChange = (e) => {
    if (e.target.value.length <= 50) setTitle(e.target.value);
  };
  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= 500) setDescription(e.target.value);
  };

  // Submit do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit - iniciando submissão...");
    if (!fileUpload) {
      alert("Por favor, selecione uma imagem antes de cadastrar a doação.");
      return;
    }
    if (!latitude || !longitude) {
      alert("Por favor, informe sua localização, usando GPS ou selecionando um endereço.");
      return;
    }
    if (!title || !description || !locationText) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    try {
      // Upload da imagem
      const fileRef = ref(storage, `donationImages/${fileUpload.name}`);
      await uploadBytes(fileRef, fileUpload);
      console.log("handleSubmit - imagem enviada:", fileUpload.name);

      // Monta campos extras
      const extraFields = {};
      fields.forEach((field) => {
        if (field.name && field.value) extraFields[field.name] = field.value;
      });
      const finalType = donationType === "Outros" ? customType : donationType;

      await addDoc(collection(db, "donationItems"), {
        title,
        description,
        userId: auth?.currentUser?.uid,
        imageUrl: `donationImages/${fileUpload.name}`,
        location: locationText,
        latitude,
        longitude,
        donationType: finalType,
        status: "disponível",
        createdAt: serverTimestamp(),
        ...extraFields,
      });
      console.log("handleSubmit - doação cadastrada com sucesso.");

      // Limpa formulário
      setTitle("");
      setDescription("");
      setFileUpload(null);
      setPreviewUrl("");
      setLocationText("");
      setLatitude(null);
      setLongitude(null);
      setFields([]);
      setDonationType("Alimentos");
      setCustomType("");
      localStorage.removeItem("addDonationForm");

      alert("Doação cadastrada com sucesso.");
      navigate("/my-donations");
    } catch (error) {
      console.error("handleSubmit - erro ao cadastrar a doação:", error);
      alert("Ocorreu um erro ao cadastrar a doação.");
    }
  };

  // Estilos
  const pageBackgroundStyle = {
    backgroundColor: "#e9ecef",
    minHeight: "100vh",
    padding: "30px 0",
  };

  const containerStyle = {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    marginBottom: "5px",
    fontWeight: "500",
    color: "#6c757d",
  };

  const inputStyle = {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    width: "100%",
    marginBottom: "15px",
    fontSize: "16px",
    outline: "none",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "15px",
  };

  const buttonStyle = {
    padding: "10px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "opacity 0.2s",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "#fff",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
  };

  const fileButtonStyle = {
    ...secondaryButtonStyle,
    width: "100%",
    marginBottom: "15px",
    textAlign: "center",
  };

  const previewImageStyle = {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "5px",
    marginBottom: "10px",
    alignSelf: "center",
    border: "2px solid #ddd",
  };

  const titleStyle = {
    textAlign: "center",
    marginBottom: "20px",
    color: "#343a40",
  };

  // Hover para botões
  const handleButtonHover = (e) => { e.target.style.opacity = 0.8; };
  const handleButtonLeave = (e) => { e.target.style.opacity = 1; };

  return (
    <div style={pageBackgroundStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Fazer uma Doação</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <label htmlFor="title" style={labelStyle}>
            Título do Item (máx. 50 caracteres)
          </label>
          <input
            id="title"
            placeholder="Ex.: Cesta Básica"
            value={title}
            onChange={handleTitleChange}
            style={inputStyle}
          />
          <label htmlFor="description" style={labelStyle}>
            Descrição do Item (máx. 500 caracteres)
          </label>
          <textarea
            id="description"
            placeholder="Ex.: Contém arroz, feijão, macarrão, etc."
            value={description}
            onChange={handleDescriptionChange}
            style={textareaStyle}
          />
          <label htmlFor="donationType" style={labelStyle}>
            Tipo da Doação
          </label>
          <select
            id="donationType"
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
            style={selectStyle}
          >
            <option value="Alimentos">Alimentos</option>
            <option value="Brinquedos">Brinquedos</option>
            <option value="Roupas">Roupas</option>
            <option value="Móveis">Móveis</option>
            <option value="Eletronicos">Eletrônicos</option>
            <option value="Eletrodomesticos">Eletrodomésticos</option>
            <option value="Outros">Outros</option>
          </select>
          {donationType === "Outros" && (
            <>
              <label htmlFor="customType" style={labelStyle}>
                Digite o tipo da doação
              </label>
              <input
                id="customType"
                placeholder="Ex.: Produtos de higiene"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                style={inputStyle}
              />
            </>
          )}
          <label htmlFor="locationText" style={labelStyle}>
            Localização
          </label>
          <div style={{ marginBottom: "15px" }}>
            <CustomPlacesAutocomplete
              placeholder="Digite seu endereço..."
              onSelect={(value) => {
                console.log("Valor retornado do CustomPlacesAutocomplete:", value);
                handleSelectPlace(value);
              }}
            />
          </div>
          <div style={buttonContainerStyle}>
            <button
              type="button"
              onClick={handleGetLocation}
              style={secondaryButtonStyle}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              Usar minha localização (GPS)
            </button>
          </div>
          <label style={labelStyle}>Campos Extras (opcionais)</label>
          {fields.map((field, index) => (
            <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                placeholder="Nome do Campo (ex: Peso)"
                value={field.name}
                onChange={(e) => updateFieldName(index, e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <input
                placeholder="Valor (ex: 10kg)"
                value={field.value}
                onChange={(e) => updateFieldValue(index, e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <button
                type="button"
                onClick={() => removeField(index)}
                style={{ ...secondaryButtonStyle, padding: "10px 12px" }}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addField}
            style={secondaryButtonStyle}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            + Adicionar Campo
          </button>
          <label style={{ ...labelStyle, marginTop: "15px" }}>Imagem do Item</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              console.log("Imagem selecionada:", e.target.files[0]);
              setFileUpload(e.target.files[0]);
            }}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            style={fileButtonStyle}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            Escolher Imagem
          </button>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              style={previewImageStyle}
            />
          )}
          <button
            type="submit"
            style={primaryButtonStyle}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            Cadastrar Doação
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDonation;
