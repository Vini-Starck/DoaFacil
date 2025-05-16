// src/components/AdSense.js
import React, { useEffect } from 'react';

// AdSense component to display Google AdSense ads
// This component is designed to be used in a React application
export default function AdSense({ adSlot, style = { display: 'block' } }) {
  useEffect(() => {
    // Insere o bloco de anúncio
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-6666580817168751"
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
