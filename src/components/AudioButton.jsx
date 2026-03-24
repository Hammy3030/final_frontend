import React from 'react';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { speakText, stopSpeech } from '../utils/speechHelper';

/**
 * A reusable audio button component for students (non-readers)
 * 
 * @param {string} text - The text to speak
 * @param {string} variant - 'normal' | 'mini' | 'ghost' | 'large'
 * @param {string} className - Additional Tailwind classes
 * @param {string} iconSize - Size for the Volume2 icon
 */
const AudioButton = ({ 
  text, 
  variant = 'normal', 
  className = '', 
  iconSize = 20,
  autoPlay = false 
}) => {
  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (text) {
      speakText(text);
    }
  };

  React.useEffect(() => {
    if (autoPlay && text) {
      const timer = setTimeout(() => {
        speakText(text);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, text]);

  const variants = {
    normal: "p-2.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors shadow-sm",
    mini: "p-1.5 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors",
    ghost: "p-2 rounded-full text-indigo-400 hover:bg-indigo-50 transition-colors",
    large: "p-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:scale-110 active:scale-95 transition-all shadow-md"
  };

  if (!text) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handlePlay}
      className={`${variants[variant] || variants.normal} ${className} flex items-center justify-center`}
      title="ฟังเสียง"
      onMouseEnter={() => {
        // Optional: stop any other playing audio if needed
      }}
    >
      <Volume2 size={iconSize} />
    </motion.button>
  );
};

export default AudioButton;
