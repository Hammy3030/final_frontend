import axios from 'axios';
import { getApiUrl } from './apiConfig';

let currentAudio = null;

export const stopSpeaking = () => {
    // Stop OpenAI Audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    // Stop Browser TTS
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

export const speak = async (text, lang = 'th-TH') => {
    // Always stop previous speech first
    stopSpeaking();

    try {
        // Try OpenAI TTS via Backend
        const response = await axios.post(getApiUrl('/tts/generate'), 
            { text },
            { responseType: 'blob' }
        );

        const audioUrl = URL.createObjectURL(response.data);
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        
        // Clean up URL object after playing
        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
        };
    } catch (error) {
        console.error('OpenAI TTS failed, falling back to browser synthesis:', error);
        
        // Fallback to browser TTS
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(v => v.lang === 'th-TH' || v.name.includes('Thai'));
        if (thaiVoice) utterance.voice = thaiVoice;

        window.speechSynthesis.speak(utterance);
    }
};

