import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldAlert, Play, Activity, Radio } from 'lucide-react';
import ChoiceCard from './components/ChoiceCard';
import Narrator from './components/Narrator';
import './index.css';

function App() {
  const [gameState, setGameState] = useState('title'); 
  const [health, setHealth] = useState(100);
  const [textToSpeak, setTextToSpeak] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const startGame = () => {
    setGameState('playing');
    setIsShaking(true);
    setTextToSpeak("Warning: Seismic activity detected. Evacuation protocols engaged.");
  };

  const handleChoice = (damage, response) => {
    setHealth(prev => Math.max(0, prev - damage));
    setTextToSpeak(response);
    if (damage === 0) setIsShaking(false);
  };

  return (
    <div className={`h-screen w-screen flex items-center justify-center relative ${isShaking ? 'animate-shake' : ''}`}>
      
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-50"></div>

      <AnimatePresence mode="wait">
        {gameState === 'title' ? (
          <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center z-10">
            <div className="flex items-center justify-center gap-2 text-red-500 font-black mb-4 tracking-[0.3em] uppercase animate-pulse">
              <Activity size={20} /> Neural Link Active
            </div>
            <h1 className="text-8xl md:text-9xl font-black uppercase italic tracking-tighter mb-10 bg-gradient-to-b from-white to-gray-600 bg-clip-text text-transparent">
              DISASTER<br/>SIMULATOR
            </h1>
            <button onClick={startGame} className="bg-red-600 hover:bg-red-500 px-12 py-5 rounded-sm font-black text-2xl uppercase italic flex items-center gap-4 mx-auto transition-all">
              Start Simulation <Play fill="white" size={24} />
            </button>
          </motion.div>
        ) : (
          <div className="w-full h-full flex flex-col items-center p-10 relative">
            
            {/* PLAYER HUD */}
            <div className="absolute top-8 left-8 flex items-center gap-6 bg-black/80 p-5 border-l-4 border-red-600 shadow-2xl">
              <Heart className={`w-10 h-10 ${health < 40 ? 'text-red-600 animate-pulse' : 'text-red-500'}`} fill="currentColor" />
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Vital Signs</p>
                <p className="text-4xl font-black tabular-nums">{health}%</p>
              </div>
            </div>

            {/* DISPATCH WINDOW */}
            <div className="flex flex-col items-center justify-center flex-grow w-full max-w-5xl mt-16">
              <div className="flex items-center gap-2 text-red-500 mb-4 uppercase font-bold tracking-widest text-sm">
                <Radio size={16} className="animate-bounce" /> Emergency Broadcast
              </div>
              <h2 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-center">Seismic Event Detected</h2>
              <p className="text-2xl text-gray-400 text-center max-w-3xl font-medium italic mb-12">
                "{textToSpeak || "The earth is trembling. Choose your path to survival."}"
              </p>

              {/* ACTION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <ChoiceCard text="Secure Position Under Desk" onSelect={() => handleChoice(0, "Survival secured. Structure remains intact.")} />
                <ChoiceCard text="Evacuate Via Stairwell" onSelect={() => handleChoice(50, "Catastrophic failure. Debris has caused major trauma.")} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <Narrator textToSpeak={textToSpeak} />
    </div>
  );
}

export default App;