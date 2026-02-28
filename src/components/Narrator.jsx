import React, { useEffect, useRef } from 'react';

const Narrator = ({ textToSpeak }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (textToSpeak) {
      const fetchAudio = async () => {
        try {
          if (audioRef.current) audioRef.current.pause();
          const response = await fetch('http://localhost:5000/api/narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak }),
          });
          if (!response.ok) throw new Error('Server response was not ok');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          audioRef.current = new Audio(url);
          audioRef.current.play();
        } catch (err) {
          console.error("Narrator Error:", err);
        }
      };
      fetchAudio();
    }
  }, [textToSpeak]);

  return null; 
};

export default Narrator;