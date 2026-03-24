import axios from 'axios';
import { getApiUrl } from './apiConfig';

/**
 * Utility to fetch and play audio from ElevenLabs TTS backend
 * Includes basic caching to minimize API calls
 */

const audioCache = new Map();

/**
 * Play text-to-speech using ElevenLabs backend
 * @param {string} text - Text to speak
 * @param {string} voice - Voice ID to use
 * @returns {Promise<HTMLAudioElement>}
 */
export const speakWithElevenLabs = async (text, voice = 'XgQWNZcJ8SRkxXwwhPTo') => {
  if (!text) return null;

  try {
    const cacheKey = `${voice}:${text}`;
    let audioUrl;

    if (audioCache.has(cacheKey)) {
      audioUrl = audioCache.get(cacheKey);
    } else {
      const response = await axios.post(
        getApiUrl('/tts/generate'),
        { text, voice },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(blob);
      audioCache.set(cacheKey, audioUrl);
    }

    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.play()
        .then(() => resolve(audio))
        .catch(err => {
          console.error('Audio playback failed:', err);
          reject(err);
        });
    });
  } catch (error) {
    console.error('ElevenLabs TTS fetch failed:', error);
    throw error;
  }
};
