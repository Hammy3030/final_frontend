import axios from 'axios';
import { getApiUrl } from './apiConfig';

/**
 * Utility to fetch and play audio from OpenAI TTS backend
 * Includes basic caching to minimize API calls
 */

const audioCache = new Map();

/**
 * Play text-to-speech using OpenAI backend
 * @param {string} text - Text to speak
 * @param {string} voice - Voice to use (shimmer, alloy, etc.)
 * @returns {Promise<HTMLAudioElement>}
 */
export const speakWithOpenAI = async (text, voice = 'shimmer') => {
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
    
    // Return a promise that resolves when audio starts playing
    // or rejects on error
    return new Promise((resolve, reject) => {
      audio.play()
        .then(() => resolve(audio))
        .catch(err => {
          console.error('Audio playback failed:', err);
          reject(err);
        });
    });
  } catch (error) {
    console.error('OpenAI TTS fetch failed:', error);
    throw error;
  }
};
