import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Play, Activity, Radio, User } from 'lucide-react'
import ChoiceCard from './components/ChoiceCard'
import Narrator from './components/Narrator'
import './index.css'

function App() {
  const [gameState, setGameState] = useState('title')
  const [health, setHealth] = useState(100)
  const [textToSpeak, setTextToSpeak] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [playerAction, setPlayerAction] = useState('idle')

  const startGame = () => {
    setGameState('playing')
    setIsShaking(true)
    setPlayerAction('idle')
    setTextToSpeak('Warning: Seismic activity detected. Evacuation protocols engaged.')
  }

  const handleChoice = (damage, response, actionType) => {
    setHealth((prev) => Math.max(0, prev - damage))
    setTextToSpeak(response)
    setPlayerAction(actionType)
    if (damage === 0) {
      setIsShaking(false)
    } else {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 800)
    }
  }

  const playerVariants = {
    idle: { x: 0, y: 0, backgroundColor: '#3b82f6', scale: 1 },
    desk: { x: -100, y: 40, backgroundColor: '#22c55e', scale: 0.85 },
    stairs: {
      x: 120,
      y: -40,
      backgroundColor: '#ef4444',
      scale: 1.1,
      rotate: [0, -20, 20, -20, 0],
      transition: { rotate: { repeat: 3, duration: 0.15 } },
    },
  }

  return (
    <div
      className={`h-screen w-screen bg-slate-950 text-white overflow-hidden flex items-center justify-center font-sans ${isShaking ? 'animate-shake' : ''}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-50"></div>

      <AnimatePresence mode="wait">
        {gameState === 'title' ? (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center z-10"
          >
            <div className="flex items-center justify-center gap-2 text-red-500 font-black mb-4 tracking-[0.3em] uppercase animate-pulse">
              <Activity size={20} /> Neural Link Active
            </div>
            <h1 className="text-8xl md:text-9xl font-black uppercase italic tracking-tighter mb-10 bg-gradient-to-b from-white via-gray-300 to-gray-700 bg-clip-text text-transparent">
              DISASTER
              <br />
              SIMULATOR
            </h1>
            <button
              onClick={startGame}
              className="bg-red-600 hover:bg-red-500 px-16 py-6 rounded-sm font-black text-3xl uppercase italic flex items-center gap-4 mx-auto transition-all"
            >
              Start Simulation <Play fill="white" size={32} />
            </button>
          </motion.div>
        ) : (
          <div className="w-full h-full flex flex-col items-center p-8 relative">
            <div className="absolute top-8 left-8 flex items-center gap-6 bg-black/80 p-5 border-l-4 border-red-600 shadow-2xl z-20">
              <Heart
                className={`w-10 h-10 ${health < 40 ? 'text-red-600 animate-pulse' : 'text-red-500'}`}
                fill="currentColor"
              />
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">
                  Vital Signs
                </p>
                <p className="text-4xl font-black tabular-nums">{health}%</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl mt-10">
              <div className="relative w-full max-w-xl h-64 bg-slate-900 border-2 border-slate-700 rounded-xl mb-8 overflow-hidden flex items-center justify-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-bold tracking-widest text-red-500 uppercase animate-pulse">
                  <Radio size={14} /> Live Area Feed
                </div>
                <div className="absolute bottom-8 left-12 w-32 h-16 border-2 border-green-500/30 bg-green-500/10 border-dashed rounded flex items-center justify-center text-green-500/50 font-black text-sm tracking-widest">
                  DESK
                </div>
                <div className="absolute top-8 right-12 w-28 h-32 border-2 border-red-500/30 bg-red-500/10 border-dashed rounded flex items-center justify-center text-red-500/50 font-black text-sm tracking-widest">
                  STAIRWELL
                </div>
                <motion.div
                  variants={playerVariants}
                  animate={playerAction}
                  initial="idle"
                  className="absolute w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10"
                >
                  <User className="text-white" size={24} />
                </motion.div>
              </div>

              <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-center">
                Seismic Event Detected
              </h2>
              <p className="text-xl text-gray-400 text-center max-w-2xl font-medium italic mb-8 h-12">
                &quot;{textToSpeak || 'The earth is trembling. Choose your path to survival.'}&quot;
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                <ChoiceCard
                  text="Secure Position Under Desk"
                  onSelect={() =>
                    handleChoice(0, 'Survival secured. Structure remains intact.', 'desk')
                  }
                />
                <ChoiceCard
                  text="Evacuate Via Stairwell"
                  onSelect={() =>
                    handleChoice(
                      50,
                      'Catastrophic failure. Debris has caused major trauma.',
                      'stairs'
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <Narrator textToSpeak={textToSpeak} />
    </div>
  )
}

export default App
