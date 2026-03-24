import { speakWithElevenLabs } from './elevenLabsTTS';
/**
 * Speech Helper using native Web Speech API
 * Bypasses network/quota issues by using local browser voices
 */

function getThaiVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer Microsoft Narachat Online or other high-quality Thai voices if available
  const thai = voices.find(v => v.lang === 'th-TH' && v.name.includes('Online')) || 
               voices.find(v => v.lang === 'th-TH') || 
               voices.find(v => v.lang.startsWith('th'));
  return thai || voices[0];
}

const CONSONANT_MAP = {
  'ก': 'ก ไก่', 'ข': 'ข ไข่', 'ฃ': 'ข ขวด', 'ค': 'ค ควาย', 'ฅ': 'ค คน', 'ฆ': 'ฆ ระฆัง',
  'ง': 'ง งู', 'จ': 'จ จาน', 'ฉ': 'ฉ ฉิ่ง', 'ช': 'ช ช้าง', 'ซ': 'ซ โซ่', 'ฌ': 'ฌ เฌอ',
  'ญ': 'ญ หญิง', 'ฎ': 'ฎ ชฎา', 'ฏ': 'ฏ ปฏัก', 'ฐ': 'ฐ ฐาน', 'ฑ': 'ฑ มณโฑ', 'ฒ': 'ฒ ผู้เฒ่า',
  'ณ': 'ณ เณร', 'ด': 'ด เด็ก', 'ต': 'ต เต่า', 'ถ': 'ถ ถุง', 'ท': 'ท ทหาร', 'ธ': 'ธ ธง',
  'น': 'น หนู', 'บ': 'บ ใบไม้', 'ป': 'ป ปลา', 'ผ': 'ผ ผึ้ง', 'ฝ': 'ฝ ฝา', 'พ': 'พ พาน',
  'ฟ': 'ฟ ฟัน', 'ภ': 'ภ สำเภา', 'ม': 'ม ม้า', 'ย': 'ย ยักษ์', 'ร': 'ร เรือ', 'ล': 'ล ลิง',
  'ว': 'ว แหวน', 'ศ': 'ศ ศาลา', 'ษ': 'ษ ฤาษี', 'ส': 'ส เสือ', 'ห': 'ห หีบ', 'ฬ': 'ฬ จุฬา',
  'อ': 'อ อ่าง', 'ฮ': 'ฮ นกฮูก'
};

/**
 * Normalizes Thai text for better pronunciation, 
 * especially for single consonants and ranges.
 */
export const normalizeThaiSpeech = (text) => {
  if (!text || typeof text !== 'string') return text;
  let normalized = text;

  // 1. Handle common ranges like ก-ง or ก ถึง ง
  normalized = normalized.replace(/([ก-ฮ])\s*-\s*([ก-ฮ])/g, (match, start, end) => {
    return `${CONSONANT_MAP[start] || start} ถึง ${CONSONANT_MAP[end] || end}`;
  });
  normalized = normalized.replace(/([ก-ฮ])\s*ถึง\s*([ก-ฮ])/g, (match, start, end) => {
    return `${CONSONANT_MAP[start] || start} ถึง ${CONSONANT_MAP[end] || end}`;
  });

  // 2. Handle single consonants
  // We look for consonants that are isolated (surrounded by non-Thai chars, punctuation, or start/end)
  // This version is safer for Thai words which don't have spaces.
  Object.keys(CONSONANT_MAP).forEach(char => {
    if (normalized === char) {
      normalized = CONSONANT_MAP[char];
    } else {
      // Logic: If char is preceded by (start OR non-consonant/vowel) 
      // AND followed by (end OR non-consonant/vowel/tone mark)
      // Thai vowels/marks check: \u0E30-\u0E4E
      const boundaryRegex = new RegExp(`(?<=[^ก-ฮ\u0E30-\u0E4E]|^)${char}(?=[^ก-ฮ\u0E30-\u0E4E]|$)`, 'g');
      normalized = normalized.replace(boundaryRegex, CONSONANT_MAP[char]);
    }
  });

  return normalized;
};

let currentAudio = null;

export const speakText = async (text, options = {}) => {
  if (!text || typeof window === 'undefined') return;

  // Normalize text for better Thai pronunciation
  const normalizedText = normalizeThaiSpeech(text);

  // Stop any ongoing speech
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  try {
    console.log('✨ Attempting ElevenLabs TTS for:', normalizedText);
    const audio = await speakWithElevenLabs(normalizedText);
    currentAudio = audio;
    console.log('✅ Playing ElevenLabs audio (Brian Cortez)');
    
    audio.onended = () => {
      currentAudio = null;
      if (options.onEnd) options.onEnd();
    };
    audio.onerror = (err) => {
      console.error('ElevenLabs audio error:', err);
      currentAudio = null;
      if (options.onError) options.onError(err);
    };
  } catch (error) {
    console.warn('❌ ElevenLabs TTS failed, falling back to Web Speech API:', error.message || error);
    
    if (!window.speechSynthesis) {
      console.error('🚨 Web Speech API not supported in this browser');
      if (options.onError) options.onError(error);
      return;
    }

    try {
      console.log('🔄 Using native fallback (Browser Voice)');
      
      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.lang = options.lang || 'th-TH';
      
      // Balanced rate for kids (local voices sound faster than AI)
      utterance.rate = options.rate ?? 0.8; 
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1;
      
      const voice = options.voice ?? getThaiVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (err) => {
        console.error('Speech synthesis error:', err);
        // If native fails, there is no further fallback
        if (options.onError) options.onError(err);
      };

      window.speechSynthesis.speak(utterance);
    } catch (nativeError) {
      console.error('Native Web Speech API runtime error:', nativeError);
    }
  }
};

/**
 * Stop current speech
 */
export const stopSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if speech is currently playing
 */
export const isSpeaking = () => {
  return window.speechSynthesis.speaking;
};

/**
 * Speak with pause between words (for better comprehension)
 * @param {string[]} words - Array of words to speak
 * @param {number} pauseMs - Pause between words in milliseconds
 */
export const speakWordsWithPause = (words, pauseMs = 500) => {
  if (!words || words.length === 0) return;

  let currentIndex = 0;

  const speakNext = () => {
    if (currentIndex < words.length) {
      speakText(words[currentIndex], {
        onEnd: () => {
          currentIndex++;
          if (currentIndex < words.length) {
            setTimeout(speakNext, pauseMs);
          }
        }
      });
    }
  };

  speakNext();
};

