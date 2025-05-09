// src/components/CustomPlacesAutocomplete.js
import React, { useState, useEffect, useCallback } from "react";

const CustomPlacesAutocomplete = ({
  placeholder,
  value,
  onChange,
  onSelect,
}) => {
  const [predictions, setPredictions] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 1) Carrega o script do Google Maps
  useEffect(() => {
    const url = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    if (!window.google?.maps?.places) {
      if (!document.querySelector(`script[src^="${url}"]`)) {
        const s = document.createElement("script");
        s.src = url;
        s.async = true;
        s.defer = true;
        s.onload = () => setScriptLoaded(true);
        s.onerror = () => setScriptLoaded(false);
        document.head.appendChild(s);
      } else {
        setScriptLoaded(true);
      }
    } else {
      setScriptLoaded(true);
    }
  }, []);

  // 2) Função memoizada para buscar previsões
  const getPredictions = useCallback(() => {
    if (!scriptLoaded || value.length < 3) {
      setPredictions([]);
      return;
    }
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: value }, (preds, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        preds
      ) {
        setPredictions(preds);
      } else {
        setPredictions([]);
      }
    });
  }, [value, scriptLoaded]);

  // 3) Toda vez que `value` mudar, busca de novo
  useEffect(() => {
    getPredictions();
  }, [getPredictions]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder={placeholder || "Digite seu endereço..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
                onChange(p.description);      // atualiza o texto
                setPredictions([]);           // fecha o dropdown
                onSelect?.(p);                // notifica o pai
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
