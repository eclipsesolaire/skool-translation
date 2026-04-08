import React, { useState } from 'react';

// URL de ton backend Flask
const API_URL = 'https://skool-backend-h3kb.onrender.com/translate';

function TranslationApp() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) {
      setError('Veuillez entrer une phrase à traduire');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      
      setOutput(data.translation || data.result || "Aucune traduction reçue");
      
    } catch (err) {
      setError(`Impossible de contacter le serveur. Vérifie que le backend Python est lancé.`);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };



  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 font-sans">

        {/* Carte principale */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 overflow-hidden p-8">
            <div className="max-w-3xl mx-auto">
              
              <div className="text-center mb-10">
                
                <div className="inline-block p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                </div>

                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  Traducteur IA
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Français → Anglais traduction réseaux de neurone 
                    </p>
              </div>

            {/* Zone d'entrée */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-indigo-700 text-sm uppercase tracking-wide">
                Texte à traduire en francais 
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Exemple: je suis étudiant en informatique"
                rows={4}
                className="w-full p-4 border-2 border-indigo-100 rounded-xl text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all bg-gray-50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleTranslate}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all transform ${
                  loading 
                    ? 'bg-indigo-400 opacity-70 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                } transition-all duration-200`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Traduction en cours...</span>
                  </div>
                ) : (
                  <span>Traduire</span>
                )}
              </button>
              
              <button
                onClick={clearAll}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transition-all duration-200 border border-gray-200"
              >
                Effacer
              </button>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Résultat */}
            <div>
              <label className="block mb-2 font-semibold text-indigo-700 text-sm uppercase tracking-wide">
                🎯 Traduction
              </label>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100 p-6 min-h-[120px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-indigo-600 font-medium">Le réseau de neurones analyse...</span>
                  </div>
                ) : output ? (
                  <div className="space-y-4">
                    <div className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
                      {output}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        {copied ? (
                          <span> text Copié</span>
                        ) : (
                            <span>Copier</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400">La traduction apparaîtra ici</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer avec stats */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-sm border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="text-sm">🧠</span>
              <span className="text-xs font-medium">RNN Encodeur-Décodeur</span>
            </div>
            <div className="w-px h-4 bg-indigo-200"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="text-sm">🎯</span>
              <span className="text-xs font-medium">Attention Mechanism</span>
            </div>
            <div className="w-px h-4 bg-indigo-200"></div>
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="text-sm">⚡</span>
              <span className="text-xs font-medium">BPE Tokenizer</span>
            </div>
          </div>
        </div>
    </div>
  );
}

export default TranslationApp;