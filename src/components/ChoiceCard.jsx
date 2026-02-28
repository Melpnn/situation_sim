import React from 'react';
import { motion } from 'framer-motion';

const ChoiceCard = ({ text, onSelect }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="w-full p-8 bg-slate-900/80 border border-slate-700 hover:border-red-500 rounded-lg text-left font-bold text-xl transition-all"
    >
      {text}
    </motion.button>
  );
};

export default ChoiceCard;