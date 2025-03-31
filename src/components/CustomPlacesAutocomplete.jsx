// src/components/CustomPlacesAutocomplete.jsx
import React, { useState, useEffect } from "react";

const CustomPlacesAutocomplete = ({ placeholder, onSelect }) => {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Função para carregar o script da API do Google Maps, se necessário
  const loadScript = (url) => {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Script da API do Google Maps carregado com sucesso.");
        resolve();
      };
      script.onerror = (err) => {
        console.error("Falha ao carregar o script da API do Google Maps:", err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDmkiXWowTV3HqXJF9sQFIrpImFOxC3lGA&libraries=places`;
    if (
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      console.log("Carregando script da API do Google Maps...");
      loadScript(googleMapsUrl)
        .then(() => setScriptLoaded(true))
        .catch((error) => {
          console.error("Erro ao carregar a API do Google Maps:", error);
          setScriptLoaded(false);
        });
    } else {
      setScriptLoaded(true);
    }
  }, []);

  // Usaremos apenas o AutocompleteService, que tem o método getPlacePredictions.
  const getPredictions = () => {
    if (!scriptLoaded) {
      console.warn("Google Maps Places API ainda não foi carregada.");
      return;
    }
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      window.google.maps.places.AutocompleteService
    ) {
      console.log("Usando AutocompleteService");
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input }, (preds, status) => {
        console.log("Status do autocomplete:", status);
        console.log("Previsões obtidas:", preds);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
          setPredictions(preds);
        } else {
          setPredictions([]);
        }
      });
    } else {
      console.warn("Google Maps Places API não está carregada.");
      setPredictions([]);
    }
  };

  useEffect(() => {
    if (input.length > 2) {
      getPredictions();
    } else {
      setPredictions([]);
    }
  }, [input, scriptLoaded]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder={placeholder || "Digite seu endereço..."}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          console.log("Input digitado:", e.target.value);
        }}
        style={{
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      />
      {predictions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "5px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            margin: 0,
            padding: 0,
            listStyle: "none",
          }}
        >
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onClick={() => {
                console.log("Previsão selecionada:", p);
                setInput(p.description); // Utilize p.description para o endereço
                setPredictions([]);
                if (onSelect) {
                  onSelect(p);
                }
              }}
              style={{
                padding: "10px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomPlacesAutocomplete;
