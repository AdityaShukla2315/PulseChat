import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';

const MessageTranslation = ({ message }) => {
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const translateMessage = async (targetLanguage) => {
    if (!message.text) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.post('/ai/translate', {
        text: message.text,
        targetLanguage
      });
      setTranslation(response.data);
      setShowTranslation(true);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!message.text) return null;

  return (
    <div className="relative group">
      <div className="dropdown dropdown-top dropdown-end">
        <button
          tabIndex={0}
          className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Languages className="w-3 h-3" />
          )}
        </button>
        
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 max-h-48 overflow-y-auto">
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => translateMessage(lang.code)}
                className="text-xs"
              >
                {lang.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showTranslation && translation && (
        <div className="mt-2 p-2 bg-base-200/50 rounded text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-base-content/60">
              Translated ({translation.sourceLanguage} → {translation.targetLanguage})
            </span>
            <span className="text-base-content/40">
              {Math.round(translation.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-base-content/80">{translation.translatedText}</p>
          <button
            onClick={() => setShowTranslation(false)}
            className="text-base-content/40 hover:text-base-content/60 mt-1"
          >
            Hide translation
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageTranslation;