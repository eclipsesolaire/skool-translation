from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import re
import os
import sys

app = Flask(__name__)

# Configuration CORS pour permettre les requêtes du frontend

CORS(app, origins="*")
 

# Ajout d'un hook pour s'assurer que les en-têtes CORS sont toujours présents
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response
 
# ===========================================================
# 1. CHARGEMENT DU MODÈLE (.pkl)
# ===========================================================
params = None
merges_fr = None
fr_vocab = None
inv_en_vocab = None

# Obtenir le chemin absolu du fichier modèle
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "mon_modele_traduction.pkl")

print(f"🔍 Recherche du modèle dans: {model_path}")
print(f"📁 Fichiers dans le dossier: {os.listdir(current_dir)}")

try:
    with open(model_path, "rb") as f:
        data_loaded = pickle.load(f)
    
    params = data_loaded["params"]
    merges_fr = data_loaded["merges_fr"]
    fr_vocab = data_loaded["fr_vocab"]
    inv_en_vocab = data_loaded["inv_en_vocab"]
    
    print("✅ Succès : Le cerveau du traducteur est chargé !")
    print(f"📊 Taille du vocabulaire français: {len(fr_vocab)}")
    print(f"📊 Taille du vocabulaire anglais: {len(inv_en_vocab)}")
    print(f"📊 Dimensions des paramètres du modèle:")
    for key, value in params.items():
        if hasattr(value, 'shape'):
            print(f"   - {key}: {value.shape}")
    
except FileNotFoundError:
    print(f"❌ Erreur : 'mon_modele_traduction.pkl' est introuvable dans {model_path}")
    print("💡 Solution: Vérifiez que le fichier est bien présent dans le dossier backend/")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erreur lors du chargement : {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ===========================================================
# 2. OUTILS DE TRAITEMENT DE TEXTE
# ===========================================================

def clean_text(text):
    """Nettoie le texte français"""
    text = text.lower()
    # Garde les lettres accentuées françaises
    text = re.sub(r"[^a-zàâçéèêëîïôûùüÿñœ' ]", "", text)
    return text.strip()

def bpe_tokenize(word, merges):
    """Tokenise un mot avec BPE"""
    tokens = list(word) + ["</w>"]
    for a, b in merges:
        i = 0
        new = []
        while i < len(tokens):
            if i < len(tokens)-1 and tokens[i] == a and tokens[i+1] == b:
                new.append(a+b)
                i += 2
            else:
                new.append(tokens[i])
                i += 1
        tokens = new
    return tokens

def to_one_hot(idx, size):
    """Convertit un index en vecteur one-hot"""
    vec = np.zeros((size, 1))
    if 0 <= idx < size:
        vec[idx] = 1
    return vec

def softmax(x):
    """Fonction softmax stable numériquement"""
    exp_x = np.exp(x - np.max(x))
    return exp_x / (np.sum(exp_x) + 1e-8)

# ===========================================================
# 3. LOGIQUE DE TRADUCTION
# ===========================================================

def translate(input_sentence, params, merges_fr, fr_vocab, idx_to_word_en, max_len=20):
    """
    Traduit une phrase du français vers l'anglais
    """
    try:
        print(f"🔄 Traduction de: '{input_sentence}'")
        
        # Étape 1: Nettoyage et tokenisation
        cleaned = clean_text(input_sentence)
        if not cleaned:
            return ""
            
        print(f"📝 Après nettoyage: '{cleaned}'")
        
        # Tokenisation BPE
        tokens_fr = ["<sos>"]
        for w in cleaned.split():
            tokens_fr.extend(bpe_tokenize(w, merges_fr))
        tokens_fr.append("<eos>")
        
        print(f"🔤 Tokens français: {tokens_fr}")
        
        # Conversion en indices
        indices_fr = []
        for t in tokens_fr:
            if t in fr_vocab:
                indices_fr.append(fr_vocab[t])
            else:
                indices_fr.append(fr_vocab.get("<unk>", 0))
        
        print(f"🔢 Indices: {indices_fr}")

        # --- ENCODEUR ---
        hidden_size_enc = params["Wh_enc"].shape[0]  # Devrait être 256
        input_size = params["Wx_enc"].shape[1]
        h_enc = np.zeros((hidden_size_enc, 1))
        
        print(f"📊 Encodeur: taille cachée={hidden_size_enc}, taille entrée={input_size}")
        
        for step, idx in enumerate(indices_fr):
            x = to_one_hot(idx, input_size)
            h_enc = np.tanh(
                np.dot(params["Wx_enc"], x) + 
                np.dot(params["Wh_enc"], h_enc) + 
                params["bh_enc"]
            )
            if step < 2:  # Afficher les premiers pas seulement
                print(f"   Pas {step}: h_enc norm = {np.linalg.norm(h_enc):.4f}")

        # --- DÉCODEUR ---
        # h1 et h2 sont tous les deux de taille 256
        h1 = np.copy(h_enc)
        h2 = np.zeros((params["Wh_dec2"].shape[0], 1))  # 256
        y_input_idx = fr_vocab.get("<sos>", 1)  # Index du token <sos>
        translated_tokens = []

        print(f"🎯 Décodeur: début de la génération")
        
        for step in range(max_len):
            # Couche 1 du décodeur
            dec_input_size = params["Wx_dec1"].shape[1]
            y_in = to_one_hot(y_input_idx, dec_input_size)
            
            h1 = np.tanh(
                np.dot(params["Wx_dec1"], y_in) + 
                np.dot(params["Wh_dec1"], h1) + 
                params["bh_dec1"]
            )
            
            # Couche 2 du décodeur
            h2 = np.tanh(
                np.dot(params["Wx_dec2"], h1) + 
                np.dot(params["Wh_dec2"], h2) + 
                params["bh_dec2"]
            )
            
            # CONCATÉNATION : h1 (256) + h2 (256) = 512
            combined = np.vstack([h1, h2])  # Shape: (512, 1)
            
            # Calcul des logits
            logits = np.dot(params["Wy"], combined) + params["by"]  # Wy: (294, 512) @ (512, 1) = (294, 1)
            
            # Sélection du mot
            probs = softmax(logits.flatten())
            idx = int(np.argmax(probs))
            token = idx_to_word_en.get(idx, "<unk>")
            
            print(f"   Pas {step}: token='{token}', proba={probs[idx]:.4f}")
            
            # Condition d'arrêt
            if token == "<eos>" or token == "":
                break
            
            translated_tokens.append(token)
            y_input_idx = idx
        
        # Reconstruire la phrase anglaise
        sentence = ""
        word = ""
        for tok in translated_tokens:
            if tok == "</w>":
                if word:
                    sentence += word + " "
                word = ""
            else:
                word += tok
        
        if word:
            sentence += word
        
        result = sentence.strip() if sentence.strip() else " ".join(translated_tokens)
        print(f"✅ Traduction finale: '{result}'")
        return result
        
    except Exception as e:
        print(f"❌ Erreur dans translate(): {e}")
        import traceback
        traceback.print_exc()
        return f"Erreur de traduction: {str(e)}"

# ===========================================================
# 4. ROUTES FLASK POUR L'API
# ===========================================================

@app.route('/translate', methods=['POST'])
def handle_translation():
    """
    Endpoint principal pour la traduction
    Attend: {"text": "phrase en français"}
    Retourne: {"translation": "phrase en anglais"}
    """
    try:
        # Récupérer les données JSON
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Aucune donnée reçue"}), 400
        
        text = data.get('text', '')
        
        if not text or not text.strip():
            return jsonify({"error": "Texte vide"}), 400
        
        print(f"📝 Requête reçue: {text}")
        
        # Effectuer la traduction
        resultat = translate(text, params, merges_fr, fr_vocab, inv_en_vocab)
        
        print(f"✅ Réponse envoyée: {resultat}")
        
        return jsonify({
            "translation": resultat,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ ERREUR dans handle_translation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/translate/batch', methods=['POST'])
def handle_batch_translation():
    """
    Endpoint pour traduire plusieurs phrases
    Attend: {"texts": ["phrase1", "phrase2"]}
    Retourne: {"translations": ["traduction1", "traduction2"]}
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({"error": "Format invalide. Attendu: {'texts': [...]}"}), 400
        
        texts = data['texts']
        results = []
        
        for text in texts:
            if text and text.strip():
                translation = translate(text, params, merges_fr, fr_vocab, inv_en_vocab)
                results.append(translation)
            else:
                results.append("")
        
        return jsonify({
            "translations": results,
            "success": True
        })
        
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/', methods=['GET'])
def home():
    """
    Page d'accueil de l'API
    """
    return jsonify({
        "message": "API de traduction Français → Anglais",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "/translate": "POST - Traduire une phrase",
            "/translate/batch": "POST - Traduire plusieurs phrases",
            "/health": "GET - Vérifier l'état du service",
            "/info": "GET - Informations sur le modèle"
        }
    })

@app.route('/health', methods=['GET'])
def health():
    """
    Vérification de santé du service
    """
    return jsonify({
        "status": "healthy",
        "model_loaded": params is not None,
        "vocab_size_fr": len(fr_vocab) if fr_vocab else 0,
        "vocab_size_en": len(inv_en_vocab) if inv_en_vocab else 0
    })

@app.route('/info', methods=['GET'])
def info():
    """
    Informations détaillées sur le modèle
    """
    if params is None:
        return jsonify({"error": "Modèle non chargé"}), 503
    
    info_dict = {
        "model_type": "RNN avec attention",
        "parameters": {},
        "vocab_fr_size": len(fr_vocab),
        "vocab_en_size": len(inv_en_vocab),
        "sample_vocab_fr": dict(list(fr_vocab.items())[:10]),
        "sample_vocab_en": dict(list(inv_en_vocab.items())[:10])
    }
    
    # Ajouter les dimensions des paramètres
    for key, value in params.items():
        if hasattr(value, 'shape'):
            info_dict["parameters"][key] = list(value.shape)
        else:
            info_dict["parameters"][key] = str(value)
    
    return jsonify(info_dict)

# ===========================================================
# 5. GESTION DES ERREURS
# ===========================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint non trouvé"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erreur interne du serveur"}), 500

# ===========================================================
# 6. DÉMARRAGE DE L'APPLICATION
# ===========================================================

if __name__ == '__main__':
    # Récupérer le port depuis les variables d'environnement (Render)
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 50)
    print("🚀 DÉMARRAGE DE L'API DE TRADUCTION")
    print("=" * 50)
    print(f"📡 Serveur démarré sur http://0.0.0.0:{port}")
    print(f"🔧 Mode: {'Production' if os.environ.get('RENDER') else 'Développement'}")
    print(f"💾 Modèle chargé: {'✅ Oui' if params else '❌ Non'}")
    print("=" * 50)
    
    # En production (Render), on utilise debug=False
    debug_mode = not bool(os.environ.get('RENDER'))
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    )