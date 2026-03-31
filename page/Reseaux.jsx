import React, { useState } from 'react';

// URL de ton backend Flask
const API_URL = 'https://skool-backend-h3kb.onrender.com/translate';

function TranslationApp() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!input.trim()) {
      setError('Veuillez entrer une phrase à traduire');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      // Appel à l'API (On envoie seulement le texte maintenant)
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
      
      // On accepte 'translation' ou 'result' selon ce que renvoie ton Python
      setOutput(data.translation || data.result || "Aucune traduction reçue");
      
    } catch (err) {
      setError(`Impossible de contacter le serveur. Vérifie que le backend Python est lancé.`);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Traducteur Français → Anglais</h1>
        <p style={styles.subtitle}>Intelligence Artificielle (RNN + BPE)</p>

        <div style={styles.inputSection}>
          <label style={styles.label}>Phrase en français :</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Exemple: je suis étudiant"
            rows={4}
            style={styles.textarea}
            disabled={loading}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={handleTranslate}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Traduction..." : "🔤 Traduire"}
          </button>
          
          <button
            onClick={clearAll}
            disabled={loading}
            style={styles.secondaryButton}
          >
            🗑️ Effacer
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.outputSection}>
          <label style={styles.label}>Résultat :</label>
          <div style={styles.outputBox}>
            {loading ? (
              <div style={styles.loadingAnimation}>
                <div style={styles.spinner}></div>
                <span>Le réseau de neurones réfléchit...</span>
              </div>
            ) : output ? (
              <div style={styles.translationResult}>
                {output}
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  style={styles.copyButton}
                >
                  📋
                </button>
              </div>
            ) : (
              <div style={styles.placeholder}>La traduction apparaîtra ici</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: { minHeight: '100vh', padding: '40px 20px', backgroundColor: '#f5f7fb', fontFamily: 'sans-serif' },
  card: { maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 10px 0', color: '#1a202c', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#718096', marginBottom: '30px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' },
  textarea: { width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '10px', margin: '20px 0' },
  button: { padding: '12px', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
  primaryButton: { backgroundColor: '#4c51bf', color: 'white' },
  secondaryButton: { backgroundColor: '#edf2f7', color: '#4a5568' },
  outputBox: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', minHeight: '80px', backgroundColor: '#f8fafc' },
  translationResult: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', color: '#2d3748' },
  copyButton: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' },
  placeholder: { color: '#a0aec0', textAlign: 'center', paddingTop: '20px' },
  errorBox: { backgroundColor: '#fff5f5', color: '#c53030', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  loadingAnimation: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  spinner: { width: '18px', height: '18px', border: '2px solid #cbd5e0', borderTop: '2px solid #4c51bf', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

// Injection du CSS pour l'animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(styleSheet);
}

export default TranslationApp;