import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import torch
import torch.nn as nn
import io 
import re
import sys



app = Flask(__name__)
CORS(app, origins="*")

# ============================================================
# 1. DÉFINITION DU MODÈLE
# ============================================================
class Seq2SeqAttention(nn.Module):
    def __init__(self, input_size, hidden1, hidden2, output_size, attn_dim=256):
        super().__init__()
        self.hidden1 = hidden1
        self.hidden2 = hidden2
        self.attn_dim = attn_dim

        # Encodeur
        self.Wx_enc = nn.Linear(input_size, hidden1)
        self.Wh_enc = nn.Linear(hidden1, hidden1)
        self.bh_enc = nn.Parameter(torch.zeros(hidden1))

        # Décodeur couche 1
        self.Wx_dec1 = nn.Linear(output_size, hidden1)
        self.Wh_dec1 = nn.Linear(hidden1, hidden1)
        self.bh_dec1 = nn.Parameter(torch.zeros(hidden1))

        # Décodeur couche 2
        self.Wx_dec2 = nn.Linear(hidden1, hidden2)
        self.Wh_dec2 = nn.Linear(hidden2, hidden2)
        self.bh_dec2 = nn.Parameter(torch.zeros(hidden2))

        # Attention
        self.Wa = nn.Linear(hidden2, attn_dim)
        self.Ua = nn.Linear(hidden1, attn_dim)
        self.ba = nn.Parameter(torch.zeros(attn_dim))
        self.va = nn.Linear(attn_dim, 1)

        # Sortie
        self.Wy = nn.Linear(hidden2 + hidden1, output_size)
        self.by = nn.Parameter(torch.zeros(output_size))

    def forward(self, x, y):
        # Non utilisé pour l'inférence
        pass

# ============================================================
# 2. CHARGEMENT DU MODÈLE
# ============================================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🔌 Device : {device}")

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "mon_modele_traduction.pkl")

if not os.path.exists(model_path):
    print(f"❌ Fichier non trouvé : {model_path}")
    print(f"📁 Fichiers dans le dossier : {os.listdir(current_dir)}")
    sys.exit(1)


try:
    class CPU_Unpickler(pickle.Unpickler):
        def find_class(self, module, name):
            # Intercepte la reconstruction des tenseurs torch
            if module == 'torch.storage' and name == '_load_from_bytes':
                return lambda b: torch.load(io.BytesIO(b), map_location='cpu', weights_only=False)
            return super().find_class(module, name)

    with open(model_path, 'rb') as f:
        unpickler = CPU_Unpickler(f)
        data = unpickler.load()

    print(f"🔑 Clés dans le fichier : {data.keys()}")

    if "model_state" not in data:
        print("❌ Fichier incorrect : clé 'model_state' manquante.")
        sys.exit(1)

    model_state = data["model_state"]
    merges_fr = data["merges_fr"]
    fr_vocab = data["fr_vocab"]
    inv_en_vocab = data["inv_en_vocab"]

    input_size = len(fr_vocab)
    output_size = len(inv_en_vocab)

    model = Seq2SeqAttention(input_size, 256, 256, output_size).to(device)
    model.load_state_dict(model_state)
    model.eval()

    print(f"✅ Modèle chargé avec succès !")
    print(f"📊 Vocabulaire français : {input_size} mots")
    print(f"📊 Vocabulaire anglais : {output_size} mots")
    print(f"🔢 Nombre de règles BPE : {len(merges_fr)}")

except Exception as e:
    print(f"❌ Erreur lors du chargement : {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


# ============================================================
# 3. FONCTIONS DE TRADUCTION
# ============================================================
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zàâçéèêëîïôûùüÿñœ' ]", "", text)
    return text.strip()

def bpe_tokenize(word, merges):
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

def translate(sentence, model, merges_fr, fr_vocab, idx_to_word_en, max_len=20):
    model.eval()
    with torch.no_grad():
        # Nettoyage
        cleaned = clean_text(sentence)
        if not cleaned:
            return ""
        
        # Tokenisation BPE
        tokens_fr = ["<sos>"]
        for w in cleaned.split():
            tokens_fr.extend(bpe_tokenize(w, merges_fr))
        tokens_fr.append("<eos>")
        
        # Conversion en indices
        indices_fr = [fr_vocab.get(t, 0) for t in tokens_fr]
        
        # Encodeur
        h = torch.zeros(1, model.hidden1, device=device)
        H_enc = []
        
        for idx in indices_fr:
            x = torch.zeros(1, model.Wx_enc.in_features, device=device)
            x[0, idx] = 1.0
            h = torch.tanh(model.Wx_enc(x) + model.Wh_enc(h) + model.bh_enc)
            H_enc.append(h)
        
        H_enc = torch.cat(H_enc, dim=0)
        
        # Décodeur
        h1 = h.clone()
        h2 = torch.zeros(1, model.hidden2, device=device)
        sos_idx = fr_vocab.get("<sos>", 1)
        y_input = torch.zeros(1, model.Wy.out_features, device=device)
        y_input[0, sos_idx] = 1.0
        
        translated_tokens = []
        
        for _ in range(max_len):
            # Couche 1
            h1 = torch.tanh(model.Wx_dec1(y_input) + model.Wh_dec1(h1) + model.bh_dec1)
            # Couche 2
            h2 = torch.tanh(model.Wx_dec2(h1) + model.Wh_dec2(h2) + model.bh_dec2)
            
            # Attention
            query = model.Wa(h2)
            keys = model.Ua(H_enc)
            energy = torch.tanh(query + keys + model.ba)
            scores = model.va(energy)
            attn_weights = torch.softmax(scores.T, dim=1)
            context = attn_weights @ H_enc
            
            # Sortie
            combined = torch.cat((h2, context), dim=1)
            logits = model.Wy(combined) + model.by
            probs = torch.softmax(logits, dim=1)
            idx = torch.argmax(probs, dim=1).item()
            token = idx_to_word_en.get(idx, "<unk>")
            
            if token == "<eos>":
                break
            
            translated_tokens.append(token)
            y_input = torch.zeros(1, model.Wy.out_features, device=device)
            y_input[0, idx] = 1.0
        
        # Reconstruction
        words = []
        current_word = ""
        for tok in translated_tokens:
            if tok == "</w>":
                if current_word:
                    words.append(current_word)
                current_word = ""
            else:
                current_word += tok
        if current_word:
            words.append(current_word)
        
        return " ".join(words)

# ============================================================
# 4. ROUTES FLASK
# ============================================================
@app.route('/translate', methods=['POST'])
def handle_translation():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Format invalide. Attendu: {'text': '...'}"}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({"error": "Texte vide"}), 400
        
        result = translate(text, model, merges_fr, fr_vocab, inv_en_vocab)
        return jsonify({"translation": result, "success": True})
    
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "vocab_fr": len(fr_vocab),
        "vocab_en": len(inv_en_vocab)
    })

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "API de traduction Français → Anglais",
        "endpoints": ["/translate (POST)", "/health (GET)"]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("="*50)
    print("🚀 SERVEUR DE TRADUCTION")
    print("="*50)
    print(f"📡 http://localhost:{port}")
    print(f"🔧 Modèle : PyTorch (175k phrases)")
    print("="*50)
    app.run(host='0.0.0.0', port=port, debug=True)

CORS(app, resources={
    r"/*": {
        "origins": ["https://skool-frontend-ohe0.onrender.com", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "https://skool-frontend-ohe0.onrender.com"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response