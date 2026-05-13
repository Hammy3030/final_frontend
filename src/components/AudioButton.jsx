import React from 'react';
import { Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { speakText } from '../utils/speechHelper';

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
  autoPlay = false,
  onClick
}) => {
  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
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
    normal:
      'p-2.5 rounded-full bg-white border border-white/10 text-blue-600 hover:bg-slate-50 transition-colors shadow-sm',
    mini:
      'p-2 rounded-full bg-white border border-white/10 text-blue-600 hover:bg-slate-50 transition-colors shadow-sm',
    ghost:
      'p-2 rounded-full bg-white border border-white/10 text-blue-600 hover:bg-blue-50/80 transition-colors',
    large:
      'p-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl ring-4 ring-indigo-200'
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
