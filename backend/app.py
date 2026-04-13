# app.py
import os
import pickle
import torch
import torch.nn as nn
import io
import re
import streamlit as st

# ------------------------------------------------------------
# 1. Même définition du modèle (Seq2SeqAttention)
# ------------------------------------------------------------
class Seq2SeqAttention(nn.Module):
    def __init__(self, input_size, hidden1, hidden2, output_size, attn_dim=256):
        super().__init__()
        self.hidden1 = hidden1
        self.hidden2 = hidden2
        self.attn_dim = attn_dim
        self.Wx_enc = nn.Linear(input_size, hidden1)
        self.Wh_enc = nn.Linear(hidden1, hidden1)
        self.bh_enc = nn.Parameter(torch.zeros(hidden1))
        self.Wx_dec1 = nn.Linear(output_size, hidden1)
        self.Wh_dec1 = nn.Linear(hidden1, hidden1)
        self.bh_dec1 = nn.Parameter(torch.zeros(hidden1))
        self.Wx_dec2 = nn.Linear(hidden1, hidden2)
        self.Wh_dec2 = nn.Linear(hidden2, hidden2)
        self.bh_dec2 = nn.Parameter(torch.zeros(hidden2))
        self.Wa = nn.Linear(hidden2, attn_dim)
        self.Ua = nn.Linear(hidden1, attn_dim)
        self.ba = nn.Parameter(torch.zeros(attn_dim))
        self.va = nn.Linear(attn_dim, 1)
        self.Wy = nn.Linear(hidden2 + hidden1, output_size)
        self.by = nn.Parameter(torch.zeros(output_size))

    def forward(self, x, y):
        pass  # non utilisé en inférence

# ------------------------------------------------------------
# 2. Fonctions de nettoyage, BPE, traduction (inchangées)
# ------------------------------------------------------------
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
    device = next(model.parameters()).device
    with torch.no_grad():
        cleaned = clean_text(sentence)
        if not cleaned:
            return ""
        tokens_fr = ["<sos>"]
        for w in cleaned.split():
            tokens_fr.extend(bpe_tokenize(w, merges_fr))
        tokens_fr.append("<eos>")
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
            h1 = torch.tanh(model.Wx_dec1(y_input) + model.Wh_dec1(h1) + model.bh_dec1)
            h2 = torch.tanh(model.Wx_dec2(h1) + model.Wh_dec2(h2) + model.bh_dec2)
            query = model.Wa(h2)
            keys = model.Ua(H_enc)
            energy = torch.tanh(query + keys + model.ba)
            scores = model.va(energy)
            attn_weights = torch.softmax(scores.T, dim=1)
            context = attn_weights @ H_enc
            combined = torch.cat((h2, context), dim=1)
            logits = model.Wy(combined) + model.by
            probs = torch.softmax(logits, dim=1)
            idx = torch.argmax(probs, dim=1).item()
            if isinstance(idx_to_word_en, dict):
                token = idx_to_word_en.get(idx, "<unk>")
            elif isinstance(idx_to_word_en, list):
                token = idx_to_word_en[idx] if idx < len(idx_to_word_en) else "<unk>"
            else:
                token = "<unk>"
            if token == "<eos>":
                break
            translated_tokens.append(token)
            y_input = torch.zeros(1, model.Wy.out_features, device=device)
            y_input[0, idx] = 1.0
        # Reconstruction des mots
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

# ------------------------------------------------------------
# 3. CHARGEMENT DU MODÈLE (avec mise en cache Streamlit)
# ------------------------------------------------------------
@st.cache_resource
def load_model():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "mon_modele_traduction.pkl")
    
    class CPU_Unpickler(pickle.Unpickler):
        def find_class(self, module, name):
            if module == 'torch.storage' and name == '_load_from_bytes':
                return lambda b: torch.load(io.BytesIO(b), map_location='cpu', weights_only=False)
            return super().find_class(module, name)
    
    with open(model_path, 'rb') as f:
        unpickler = CPU_Unpickler(f)
        data = unpickler.load()
    
    model_state = data["model_state"]
    merges_fr = data["merges_fr"]
    fr_vocab = data["fr_vocab"]
    inv_en_vocab = data["inv_en_vocab"]
    
    input_size = len(fr_vocab)
    output_size = len(inv_en_vocab)
    model = Seq2SeqAttention(input_size, 256, 256, output_size).to(device)
    model.load_state_dict(model_state)
    model.eval()
    return model, merges_fr, fr_vocab, inv_en_vocab, device

# ------------------------------------------------------------
# 4. INTERFACE STREAMLIT
# ------------------------------------------------------------
st.set_page_config(page_title="Traducteur FR → EN", page_icon="🌍")
st.title("🇫🇷 → 🇬🇧 Traducteur Français-Anglais")
st.markdown("Entrez une phrase en français, le modèle la traduit en anglais.")

# Chargement (une seule fois)
with st.spinner("Chargement du modèle de traduction... (peut prendre 20-30s au premier lancement)"):
    model, merges_fr, fr_vocab, inv_en_vocab, device = load_model()
st.success("✅ Modèle prêt !")

# Zone de saisie
texte_fr = st.text_area("Phrase en français :", "Bonjour, comment allez-vous ?", height=150)

# Bouton de traduction
if st.button("Traduire", type="primary"):
    if texte_fr.strip():
        with st.spinner("Traduction en cours..."):
            traduction = translate(texte_fr, model, merges_fr, fr_vocab, inv_en_vocab)
        st.success(f"**Traduction :** {traduction}")
    else:
        st.warning("Veuillez entrer un texte.")