import { useState } from "react";

export default function CodeBlock() {
  const [copiedReact, setCopiedReact] = useState(false)
  const [copiedNetwork, setCopiedNetwork] = useState(false)

const codeReseaux = `# ===========================================================
# BPE
# ===========================================================
from google.colab import drive
import os
import pickle
import numpy as np
import pandas as pd
import re
from collections import Counter

# google colab
drive.mount('/content/drive')
SAVE_PATH = "/content/drive/MyDrive/"

# 1. télchargement données
!wget -nc https://www.manythings.org/anki/fra-eng.zip
!unzip -n fra-eng.zip

data = pd.read_csv(
    "fra.txt",
    sep="\t",
    names=["english", "french", "attr"],
    nrows=150000
)

def clean_text(text):
    text = text.lower()
    return re.sub(r"[^a-zàâçéèêëîïôûùüÿñœ' ]", "", text)

data["english"] = data["english"].apply(clean_text)
data["french"] = data["french"].apply(clean_text)

def prepare_corpus(sentences):
    corpus = []
    for s in sentences:
        for w in s.split():
            corpus.append(list(w) + ["</w>"])
    return corpus

def get_pair_stats(corpus):
    pairs = Counter()
    for word in corpus:
        for i in range(len(word)-1):
            pairs[(word[i], word[i+1])] += 1
    return pairs

def merge_pair(pair, corpus):
    a, b = pair
    new_corpus = []
    for word in corpus:
        new_word = []
        i = 0
        while i < len(word):
            if i < len(word)-1 and word[i] == a and word[i+1] == b:
                new_word.append(a+b)
                i += 2
            else:
                new_word.append(word[i])
                i += 1
        new_corpus.append(new_word)
    return new_corpus

def learn_bpe(sentences, num_merges=3000):
    corpus = prepare_corpus(sentences)
    merges = []
    for _ in range(num_merges):
        stats = get_pair_stats(corpus)
        if not stats:
            break
        best = max(stats, key=stats.get)
        corpus = merge_pair(best, corpus)
        merges.append(best)
    vocab = set(tok for word in corpus for tok in word)
    return merges, vocab

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

def build_vocab(tokens):
    vocab = {"<pad>":0, "<sos>":1, "<eos>":2}
    for t in tokens:
        if t not in vocab:
            vocab[t] = len(vocab)
    return vocab

def encode_sentence(sentence, merges, vocab, max_len):
    tokens = ["<sos>"]
    for w in sentence.split():
        tokens.extend(bpe_tokenize(w, merges))
    tokens.append("<eos>")
    ids = [vocab.get(t, 0) for t in tokens]
    if len(ids) > max_len:
        ids = ids[:max_len]
    else:
        ids = ids + [0] * (max_len - len(ids))
    return ids

print(" Apprentissage BPE français...")
merges_fr, fr_tokens = learn_bpe(data["french"])
print(f" BPE français : {len(merges_fr)} fusions")

print(" Apprentissage BPE anglais...")
merges_en, en_tokens = learn_bpe(data["english"])
print(f" BPE anglais : {len(merges_en)} fusions")

#  Vocabulaires
fr_vocab = build_vocab(fr_tokens)
en_vocab = build_vocab(en_tokens)
inv_en_vocab = {v:k for k,v in en_vocab.items()}


MAX_LEN = 20
X = []
Y = []

print(" Encodage des phrases...")
for i, (fr, en) in enumerate(zip(data["french"], data["english"])):
    X.append(encode_sentence(fr, merges_fr, fr_vocab, MAX_LEN))
    Y.append(encode_sentence(en, merges_en, en_vocab, MAX_LEN))

    if (i + 1) % 10000 == 0:
        print(f"  {i+1}/{len(data)} phrases encodées")

X = np.array(X)
Y = np.array(Y)

indices = np.random.permutation(len(X))

X = X[indices]
Y = Y[indices]

X_train = X[:65000]
Y_train = Y[:65000]

print("\n💾 Sauvegarde des fichiers...")

# Sauvegarde BPE
bpe_file = os.path.join(SAVE_PATH, "bpe_data.pkl")
with open(bpe_file, "wb") as f:
    pickle.dump({
        "merges_fr": merges_fr,
        "merges_en": merges_en,
        "fr_vocab": fr_vocab,
        "en_vocab": en_vocab,
        "inv_en_vocab": inv_en_vocab
    }, f)
print(f"✅ bpe_data.pkl créé avec succès !")

# Sauvegarde Dataset
dataset_file = os.path.join(SAVE_PATH, "dataset.pkl")
with open(dataset_file, "wb") as f:
    pickle.dump({
        "X_train": X_train,
        "Y_train": Y_train
    }, f)
print(f"✅ dataset.pkl créé avec succès !")

# Vérification
print("\n📁 Vérification des fichiers créés :")
for filename in ["bpe_data.pkl", "dataset.pkl"]:
    filepath = os.path.join(SAVE_PATH, filename)
    if os.path.exists(filepath):
        size = os.path.getsize(filepath) / (1024 * 1024)
        print(f"  ✅ {filename} - {size:.2f} MB")
    else:
        print(f"  ❌ {filename} NON TROUVÉ !")

print("\n🎉 TERMINÉ ! Maintenant tu peux lancer ton réseau de neurones.")

# ------------ AFICHAGE INFO -------------------

print("\n" + "="*60)
print("📊 APERÇU DES TOKENISATIONS")
print("="*60)

# 1. Afficher les premiers tokens du vocabulaire
print("\n PREMIERS TOKENS DU VOCABULAIRE FRANÇAIS :")
fr_tokens_list = sorted(list(fr_vocab.keys()))[:20]  
print(fr_tokens_list)


print("\n PREMIERS TOKENS DU VOCABULAIRE ANGLAIS :")
en_tokens_list = sorted(list(en_vocab.keys()))[:20]
print(en_tokens_list)


exemple_fr = "je suis étudiant"
print(f"\nPhrase originale FR: {exemple_fr}")

# Tokeniser avec BPE
tokens_fr = ["<sos>"]
for w in exemple_fr.split():
    tokens_fr.extend(bpe_tokenize(w, merges_fr))
tokens_fr.append("<eos>")

print(f"Tokens BPE : {tokens_fr}")

ids_fr = [fr_vocab.get(t, 0) for t in tokens_fr]
print(f"IDs : {ids_fr}")

# 3. Afficher quelques phrases encodées
print("\n" + "="*60)
print(" APERÇU DES DONNÉES ENCODÉES")
print("="*60)

print("\nPremières 3 phrases françaises encodées :")
for i in range(3):
    print(f"  Phrase {i+1}: {X_train[i][:10]}...") 

print("\nPremières 3 phrases anglaises encodées :")
for i in range(3):
    print(f"  Phrase {i+1}: {Y_train[i][:10]}...")

print("="*60)
print(f" Taille vocabulaire français : {len(fr_vocab)} tokens")
print(f" Taille vocabulaire anglais : {len(en_vocab)} tokens")
print(f" Nombre de fusions BPE français : {len(merges_fr)}")
print(f" Nombre de fusions BPE anglais : {len(merges_en)}")
print(f" Taille du dataset d'entraînement : {len(X_train)} phrases")
print(f" Longueur maximale des séquences : {MAX_LEN}")



# ===========================================================
#                PARTIE RÉSEAU CORRIGÉE
# ===========================================================

# Paramètres d'entraînement (à définir avant l'appel)
EPOCHS = 20
LEARNING_RATE = 0.0003
CLIP_VALUE = 5.0

# Dimensions des couches
HIDDEN1 = 256   # encodeur + decodeur couche1
HIDDEN2 = 256   # decodeur couche2
HIDDEN3 = 256   # couche de transition


# --------------------------------------------
# Fonctions d'activation et dérivées (inchangées)
# --------------------------------------------
def softmax(x):
    x = x - np.max(x)
    exp_x = np.exp(np.clip(x, -50, 50))
    return exp_x / (np.sum(exp_x) + 1e-8)

def softmax_derivative(z):
    s = softmax(z)
    return np.diag(s) - np.outer(s, s)

def gelu(x):
    c = np.sqrt(2/np.pi)
    return 0.5 * x * (1 + np.tanh(c * (x + 0.044715 * x**3)))

def derive_gelu(x):
    c = np.sqrt(2/np.pi)
    inner = c * (x + 0.044715 * x**3)
    tanh_inner = np.tanh(inner)
    sech2 = 1 - tanh_inner**2
    term1 = 0.5 * (1 + tanh_inner)
    term2 = 0.5 * x * sech2 * c * (1 + 3 * 0.044715 * x**2)
    return term1 + term2

lambda_selu = 1.0507009873554805
alpha_selu = 1.6732632423543772


def derive_tanh(x):
    t = np.tanh(x)
    return 1 - t**2

# --------------------------------------------
# Initialisation des paramètres
# --------------------------------------------
def init_params(input_size, hidden1, hidden2, output_size):
    params = {}

    # Encodeur
    params["Wx_enc"] = np.random.randn(hidden1, input_size) * 0.01
    params["Wh_enc"] = np.random.randn(hidden1, hidden1) * 0.01
    params["bh_enc"] = np.zeros((hidden1, 1))

    # Décodeur couche 1
    params["Wx_dec1"] = np.random.randn(hidden1, output_size) * 0.01
    params["Wh_dec1"] = np.random.randn(hidden1, hidden1) * 0.01
    params["bh_dec1"] = np.zeros((hidden1, 1))

    # Décodeur couche 2
    params["Wx_dec2"] = np.random.randn(hidden2, hidden1) * 0.01
    params["Wh_dec2"] = np.random.randn(hidden2, hidden2) * 0.01
    params["bh_dec2"] = np.zeros((hidden2, 1))

    # Attention
    params["Wa"] = np.random.randn(hidden1, hidden2) * 0.01
    params["Ua"] = np.random.randn(hidden1, hidden1) * 0.01
    params["va"] = np.random.randn(1, hidden1) * 0.01
    params["ba"] = np.zeros((hidden1, 1))

    # sortie
    params["Wy"] = np.random.randn(output_size, hidden2 + hidden1) * 0.01
    params["by"] = np.zeros((output_size, 1))

    return params

def one_hot(idx, size):
    vec = np.zeros((size, 1))
    if 0 <= idx < size:
        vec[idx] = 1
    return vec

# --------------------------------------------
# Forward pass
# --------------------------------------------
def forward(X_data, Y_data, params, h1_size, h2_size, output_size):
    cache = {
        'x_in': [],
        'h_enc_all': None,
        'y_in': [],
        'h1': [],
        'h2': [],
        'y_pred': [],
        'attn_weights': [],
        'contexts': [],
        'attn_query': [],
        'attn_keys': [],
        'attn_tanh': []
    }

    # ---------- Encodeur ----------
    h_enc = np.zeros((h1_size, 1))
    h_enc_list = []

    for idx in X_data:
        x = one_hot(idx, params["Wx_enc"].shape[1])
        h_enc = np.tanh( np.dot(params["Wx_enc"], x) + np.dot(params["Wh_enc"], h_enc) + params["bh_enc"])

        h_enc_list.append(h_enc)
        cache["x_in"].append(x)

    if len(h_enc_list) == 0:  # Evite de craché si aucune données n'est transmise
        h_enc_list = [np.zeros((h1_size, 1))]

    H_enc = np.hstack(h_enc_list)

    if H_enc.shape[1] == 0: # double vérification pas très utile
        H_enc = np.zeros((h1_size, 1))

    cache["h_enc_all"] = H_enc

    # ---------- Décodeur ----------
    h1 = np.copy(h_enc) # données utilisée uniquement lors de la première étapes
    h2 = np.zeros((h2_size, 1))
    outputs = []

    for t in range(len(Y_data)):
        y_prev_idx = 1 if t == 0 else Y_data[t-1]
        y_in = one_hot(y_prev_idx, output_size)

        # couche 1
        h1 = np.tanh( np.dot(params["Wx_dec1"], y_in) + np.dot(params["Wh_dec1"], h1) + params["bh_dec1"])

        # couche 2
        h2 = np.tanh(np.dot(params["Wx_dec2"], h1) + np.dot(params["Wh_dec2"], h2) + params["bh_dec2"])

        # ---------- Attention ----------
        query = np.dot(params["Wa"], h2)
        keys = np.dot(params["Ua"], H_enc)

        tanh_arg = query + keys + params["ba"]
        tanh_val = np.tanh(tanh_arg)

        scores = np.dot(params["va"], tanh_val)
        attn_w = softmax(scores)

        context = np.dot(H_enc, attn_w.T)

        # ---------- Sortie directe ----------
        combined = np.vstack((h2, context))

        y_pred = softmax( np.dot(params["Wy"], combined) + params["by"])

        outputs.append(y_pred)

        # cache
        cache["y_in"].append(y_in)
        cache["h1"].append(h1)
        cache["h2"].append(h2)
        cache["attn_weights"].append(attn_w)
        cache["contexts"].append(context)
        cache["attn_query"].append(query)
        cache["attn_keys"].append(keys)
        cache["attn_tanh"].append(tanh_val)
        cache["y_pred"].append(y_pred)

    return outputs, cache

# --------------------------------------------
# Calcul de la perte et des probabilités
# --------------------------------------------
def compute_loss(outputs, targets, ignore_pad=True):
    loss = 0.0
    count = 0

    for t, y_pred in enumerate(outputs):

        if targets[t] in [0, 1]:  # <pad>, <sos>
            continue

        prob = y_pred[targets[t], 0]
        loss -= np.log(prob + 1e-12)
        count += 1

    if count == 0:
        return 0.0

    return loss / count  # 🔥 NORMALISATION IMPORTANTE


def backpropagation(probs, targets, cache, params, clip_value=5.0):
    grads = {k: np.zeros_like(v) for k, v in params.items()}

    T = len(targets)
    dh1_next = np.zeros_like(cache["h1"][0])
    dh2_next = np.zeros_like(cache["h2"][0])

    H_enc = cache["h_enc_all"]
    # Accumulateur pour le gradient de tous les états de l'encodeur
    dH_enc = np.zeros_like(H_enc)

    # ======================================================
    # RÉTROPROPAGATION DÉCODEUR ET ATTENTION
    # ======================================================
    for t in reversed(range(T)):
        y_pred = probs[t]
        y_true = targets[t]

        # ingnore <pad> et <sos> pour pas perturber l'entrainement
        if y_true in [0, 1]:
            continue

        # Erreur de sortie comparaison entre la valeur trouvée et la valeur attendue
        dy = y_pred.copy()
        dy[y_true] -= 1

        h2_cur = cache["h2"][t]
        context = cache["contexts"][t]
        combined = np.vstack((h2_cur, context))

        # Gradients Wy et by
        grads["Wy"] += dy @ combined.T
        grads["by"] += dy

        
        dcombined = params["Wy"].T @ dy
        h2_size = h2_cur.shape[0] # taille de combine
        dh2 = dcombined[:h2_size, :] # L'index au dessus du h2 c'est l'erreur qui appartient au RNN du décodeur
        dcontext = dcombined[h2_size:, :] # L'index en-dessous du h2 c'est l'erreur qui appartient au mécanisme d'attention

        dh2 += dh2_next 

        # ATTENTION 
        attn_w = cache["attn_weights"][t]
        tanh_val = cache["attn_tanh"][t]

        # Gradient vers H_enc via le produit du contexte
        dH_enc += dcontext @ attn_w

        #Grad ient vers les scores (Softmax backprop)
        dattn_w = H_enc.T @ dcontext # (seq_len, 1)
        dattn_w = dattn_w.T          # (1, seq_len)
        dscores = attn_w * (dattn_w - np.sum(dattn_w * attn_w, axis=1, keepdims=True))

        # C. Gradient à travers la Tanh d'attention
        dtanh = params["va"].T @ dscores   # (h1, seq_len)
        dz = dtanh * (1 - tanh_val**2)      # (h1, seq_len)

        # 🔥 FIX DIMENSIONS : On somme sur l'axe du temps (seq_len) pour Wa et ba
        dz_sum = np.sum(dz, axis=1, keepdims=True) # (h1, 1)

        grads["Wa"] += dz_sum @ h2_cur.T
        grads["Ua"] += dz @ H_enc.T
        grads["va"] += dscores @ tanh_val.T
        grads["ba"] += dz_sum

        # D. Gradient vers H_enc via Ua (les "keys")
        dH_enc += params["Ua"].T @ dz

        # E. Gradient vers h2 via Wa (la "query")
        dh2 += params["Wa"].T @ dz_sum

        # --- RNN COUCHE 2 ---
        h2_prev = cache["h2"][t-1] if t > 0 else np.zeros_like(h2_cur)
        h1_cur = cache["h1"][t]
        dh2_raw = dh2 * (1 - h2_cur**2) # dérivée tanh

        grads["Wx_dec2"] += dh2_raw @ h1_cur.T
        grads["Wh_dec2"] += dh2_raw @ h2_prev.T
        grads["bh_dec2"] += dh2_raw

        dh1 = params["Wx_dec2"].T @ dh2_raw
        dh2_next = params["Wh_dec2"].T @ dh2_raw

        # --- RNN COUCHE 1 ---
        dh1 += dh1_next
        h1_prev = cache["h1"][t-1] if t > 0 else np.zeros_like(h1_cur)
        y_in = cache["y_in"][t]
        dh1_raw = dh1 * (1 - h1_cur**2)

        grads["Wx_dec1"] += dh1_raw @ y_in.T
        grads["Wh_dec1"] += dh1_raw @ h1_prev.T
        grads["bh_dec1"] += dh1_raw

        dh1_next = params["Wh_dec1"].T @ dh1_raw

    # ======================================================
    #  RÉTROPROPAGATION ENCODEUR 
    # ======================================================
    dh_enc_next = np.zeros((params["Wh_enc"].shape[0], 1))

    # On parcourt la phrase d'entrée à l'envers
    for t in reversed(range(len(cache["x_in"]))):
        h_enc_cur = H_enc[:, t:t+1]
        h_enc_prev = H_enc[:, t-1:t] if t > 0 else np.zeros_like(h_enc_cur)
        x_in = cache["x_in"][t]

        # On additionne le gradient venant de l'attention et celui du futur du RNN
        dh_total = dH_enc[:, t:t+1] + dh_enc_next

        dh_raw = dh_total * (1 - h_enc_cur**2)

        grads["Wx_enc"] += dh_raw @ x_in.T
        grads["Wh_enc"] += dh_raw @ h_enc_prev.T
        grads["bh_enc"] += dh_raw

        dh_enc_next = params["Wh_enc"].T @ dh_raw

    # Gradient Clipping final
    for k in grads:
        np.clip(grads[k], -clip_value, clip_value, out=grads[k])

    return grads

# --------------------------------------------
# Adam
# --------------------------------------------
def init_adam(params):
    m = {}
    v = {}
    for key in params:
        m[key] = np.zeros_like(params[key])
        v[key] = np.zeros_like(params[key])
    return m, v

def adam_update(params, grads, m, v, t, learning_rate=0.001, beta1=0.9, beta2=0.999, eps=1e-8):
    for key in params:
        m[key] = beta1 * m[key] + (1 - beta1) * grads[key]
        v[key] = beta2 * v[key] + (1 - beta2) * (grads[key] ** 2)
        m_hat = m[key] / (1 - beta1 ** t)
        v_hat = v[key] / (1 - beta2 ** t)
        params[key] -= learning_rate * m_hat / (np.sqrt(v_hat) + eps)
    return params, m, v

# --------------------------------------------
# Boucle d'entraînement
# --------------------------------------------
import pickle
import os

def save_checkpoint(params, m, v, step, epoch, filename):
    checkpoint = {
        "params": params,
        "m": m,
        "v": v,
        "step": step,
        "epoch": epoch,
        "rng_state": np.random.get_state()
    }

    with open(filename, "wb") as f:
        pickle.dump(checkpoint, f)

    print(f"💾 Sauvegarde OK → step {step} | epoch {epoch}")


def load_checkpoint(filename):
    if os.path.exists(filename):
        with open(filename, "rb") as f:
            checkpoint = pickle.load(f)

        # 🔥 RESTORE RNG
        if "rng_state" in checkpoint:
            np.random.set_state(checkpoint["rng_state"])

        print(f"✅ Chargé → step {checkpoint['step']} | epoch {checkpoint['epoch']}")
        return checkpoint
    else:
        print("⚠️ Aucun checkpoint trouvé")
        return None

def train_model(X, Y, params, hidden1, hidden2, output_size, epochs, lr, clip, batch_size, checkpoint_file):

    # 🔥 LOAD CHECKPOINT CORRECT
    checkpoint = load_checkpoint(checkpoint_file)

    if checkpoint is not None:
        params = checkpoint["params"]
        m = checkpoint["m"]
        v = checkpoint["v"]
        step = checkpoint["step"]
        start_epoch = checkpoint["epoch"]
    else:
        m, v = init_adam(params)
        step = 0
        start_epoch = 0

    for epoch in range(start_epoch, epochs):

        indices = np.random.permutation(len(X))
        X = X[indices]
        Y = Y[indices]

        total_loss = 0
        total_tokens = 0

        for i in range(0, len(X), batch_size):

            X_batch = X[i:i+batch_size]
            Y_batch = Y[i:i+batch_size]

            grads_accum = {k: np.zeros_like(v) for k, v in params.items()}
            batch_loss = 0
            batch_tokens = 0

            for j in range(len(X_batch)):

                outputs, cache = forward(
                    X_batch[j],
                    Y_batch[j],
                    params,
                    hidden1,
                    hidden2,
                    output_size
                )

                loss = compute_loss(outputs, Y_batch[j])
                batch_loss += loss

                batch_tokens += sum([1 for t in Y_batch[j] if t not in [0, 1]])

                grads = backpropagation(outputs, Y_batch[j], cache, params)

                for k in grads:
                    grads_accum[k] += grads[k]

            # moyenne batch
            for k in grads_accum:
                grads_accum[k] /= len(X_batch)

            # clipping
            for k in grads_accum:
                np.clip(grads_accum[k], -clip, clip, out=grads_accum[k])

            # update Adam
            step += 1
            params, m, v = adam_update(params, grads_accum, m, v, step, lr)

            total_loss += batch_loss
            total_tokens += batch_tokens

            if i % (batch_size * 50) == 0:
                print(f"Epoch {epoch+1} | Step {i}/{len(X)} | Loss: {batch_loss:.4f}")

            #  sauvgarde tout les 1000 step
            if step %  1000 == 0:
                save_checkpoint(params, m, v, step, epoch, checkpoint_file)

        avg_loss = total_loss / max(total_tokens, 1)
        print(f"\n Epoch {epoch+1}/{epochs} | Loss/token: {avg_loss:.4f}\n")

        #  SAVE fin epoch
        save_checkpoint(params, m, v, step, epoch+1, checkpoint_file)

    return params

def bpe_tokenize(word, merges_dict):
    tokens = list(word) + ["</w>"]

    while True:
        pairs = [(tokens[i], tokens[i+1]) for i in range(len(tokens)-1)]
        merge_candidates = [p for p in pairs if p in merges_dict]

        if not merge_candidates:
            break

        best = min(merge_candidates, key=lambda p: merges_dict[p])

        new_tokens = []
        i = 0
        while i < len(tokens):
            if i < len(tokens)-1 and (tokens[i], tokens[i+1]) == best:
                new_tokens.append(tokens[i] + tokens[i+1])
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1

        tokens = new_tokens

    return tokens


def softmax_temp(x, temp=0.8):
    x = x / temp
    x = x - np.max(x)
    exp_x = np.exp(x)
    return exp_x / (np.sum(exp_x) + 1e-8)


def translate(input_sentence, params, merges_fr, fr_vocab, idx_to_word_en, max_len=20):

    # convertir merges en dict
    merges_dict = {pair: i for i, pair in enumerate(merges_fr)}

    # ---------- TOKENISATION ----------
    tokens_fr = ["<sos>"]
    for w in input_sentence.lower().split():
        tokens_fr.extend(bpe_tokenize(w, merges_dict))
    tokens_fr.append("<eos>")

    indices_fr = [fr_vocab.get(t, 0) for t in tokens_fr]

    # ---------- ENCODEUR ----------
    h_states = []
    h = np.zeros((params["Wh_enc"].shape[0], 1))

    for idx in indices_fr:
        x = one_hot(idx, params["Wx_enc"].shape[1])
        h = np.tanh(
            np.dot(params["Wx_enc"], x) +
            np.dot(params["Wh_enc"], h) +
            params["bh_enc"]
        )
        h_states.append(h)

    H_enc = np.hstack(h_states) if len(h_states) > 0 else np.zeros_like(h)

    # ---------- DÉCODEUR ----------
    h1 = np.copy(h)
    h2 = np.zeros((params["Wh_dec2"].shape[0], 1))

    y_input = one_hot(1, params["Wy"].shape[0])  
    translated_tokens = []

    for step in range(max_len):

        # ----- couche 1 -----
        h1 = np.tanh(
            np.dot(params["Wx_dec1"], y_input) +
            np.dot(params["Wh_dec1"], h1) +
            params["bh_dec1"]
        )

        # ----- couche 2 -----
        h2 = np.tanh(
            np.dot(params["Wx_dec2"], h1) +
            np.dot(params["Wh_dec2"], h2) +
            params["bh_dec2"]
        )

        # ---------- attention  ----------
        query = np.dot(params["Wa"], h2)
        keys = np.dot(params["Ua"], H_enc)

        energy = np.tanh(query + keys + params["ba"])
        scores = np.dot(params["va"], energy)

        attn_w = softmax(scores)
        context = np.dot(H_enc, attn_w.T)

        # ---------- sortite  ----------
        combined = np.vstack((h2, context))
        logits = np.dot(params["Wy"], combined) + params["by"]

        #  température
        y_pred = softmax_temp(logits, temp=0.8)

        #  empêcher <sos>
        if step == 0:
            y_pred[1] = 0

        #  pénalité répétition
        for prev_tok in translated_tokens[-3:]:
            for k, v in idx_to_word_en.items():
                if v == prev_tok:
                    y_pred[k] *= 0.5

        # renormalisation
        y_pred = y_pred / (np.sum(y_pred) + 1e-8)

        #  choix final
        idx = np.argmax(y_pred)
        token = idx_to_word_en.get(idx, "<unk>")

        print(f"[Step {step}] → {token}")

        # STOP
        if token == "<eos>":
            break

        translated_tokens.append(token)
        y_input = one_hot(idx, params["Wy"].shape[0])

    # ---------- RECONSTRUCTION ----------
    sentence = []
    word = ""

    for tok in translated_tokens:
        if tok == "</w>":
            if word:
                sentence.append(word)
            word = ""
        else:
            word += tok

    if word:
        sentence.append(word)

    return " ".join(sentence)


def debug_prediction(X_sample, Y_sample, params, hidden1, hidden2, output_size, idx_to_word_en):

    outputs, _ = forward(X_sample, Y_sample, params, hidden1, hidden2, output_size)

    print("\n===== DEBUG PREDICTION =====")

    for t, y_pred in enumerate(outputs):

        pred_idx = np.argmax(y_pred)
        true_idx = Y_sample[t]

        pred_word = idx_to_word_en.get(pred_idx, "<unk>")
        true_word = idx_to_word_en.get(true_idx, "<unk>")

        print(f"t={t} | Pred: {pred_word} | True: {true_word}")


# ===========================================================
#                LANCEMENT DE L'ENTRAÎNEMENT
# ===========================================================

from google.colab import drive
import os
import pickle
import numpy as np

# 🔹 Monter Google Drive
drive.mount('/content/drive')
SAVE_PATH = "/content/drive/MyDrive/"

# 🔹 Paramètres réseau
HIDDEN1 = 256
HIDDEN2 = 256
EPOCHS = 9
LEARNING_RATE = 0.0003
CLIP_VALUE = 5.0
MAX_LEN = 20

# 🔹 Fichiers
BPE_FILE = os.path.join(SAVE_PATH, "bpe_data.pkl")
DATASET_FILE = os.path.join(SAVE_PATH, "dataset.pkl")
CHECKPOINT_FILE = os.path.join(SAVE_PATH, "checkpoint.pkl")
FINAL_MODEL_FILE = os.path.join(SAVE_PATH, "model_final.pkl")

# ===========================================================
# 1️⃣ CHARGER BPE ET DATASET
# ===========================================================
if os.path.exists(BPE_FILE):
    print("✅ Chargement BPE...")
    with open(BPE_FILE, "rb") as f:
        bpe_data = pickle.load(f)

    merges_fr = bpe_data["merges_fr"]
    merges_en = bpe_data["merges_en"]
    fr_vocab = bpe_data["fr_vocab"]
    en_vocab = bpe_data["en_vocab"]
    inv_en_vocab = bpe_data["inv_en_vocab"]
else:
    raise ValueError("❌ BPE non trouvé. Lance le block 1 pour créer le BPE.")

if os.path.exists(DATASET_FILE):
    print("✅ Chargement dataset...")
    with open(DATASET_FILE, "rb") as f:
        dataset = pickle.load(f)
    X_train = dataset["X_train"]
    Y_train = dataset["Y_train"]
else:
    raise ValueError("❌ Dataset introuvable. Lance le block 1 pour créer le dataset.")

# ===========================================================
# 2️⃣ FONCTION DE RÉINITIALISATION
# ===========================================================
def reset_and_init_model(SAVE_PATH, fr_vocab, HIDDEN1, HIDDEN2, en_vocab):
    """
    Supprime checkpoint et modèle final, réinitialise le réseau
    """
    CHECKPOINT_FILE = os.path.join(SAVE_PATH, "checkpoint.pkl")
    FINAL_MODEL_FILE = os.path.join(SAVE_PATH, "model_final.pkl")

    # Supprimer checkpoint existant
    if os.path.exists(CHECKPOINT_FILE):
        os.remove(CHECKPOINT_FILE)
        print("⚠️ Checkpoint supprimé → réinitialisation complète")

    # Supprimer modèle final existant
    if os.path.exists(FINAL_MODEL_FILE):
        os.remove(FINAL_MODEL_FILE)
        print("⚠️ Ancien modèle final supprimé")

    # Réinitialiser paramètres
    params = init_params(len(fr_vocab), HIDDEN1, HIDDEN2, len(en_vocab))
    m, v = init_adam(params)
    step = 0
    start_epoch = 0

    print("✅ Modèle réinitialisé et prêt pour un nouvel entraînement")
    return params, m, v, step, start_epoch, CHECKPOINT_FILE, FINAL_MODEL_FILE

# ===========================================================
#  CHOIX : réinitialiser ou continuer
# ===========================================================
FORCE_RESET = False

if FORCE_RESET:
    params, m, v, step, start_epoch, CHECKPOINT_FILE, FINAL_MODEL_FILE = reset_and_init_model(
        SAVE_PATH, fr_vocab, HIDDEN1, HIDDEN2, en_vocab
    )
else:
    if os.path.exists(CHECKPOINT_FILE):
        print("✅ Chargement checkpoint...")
        with open(CHECKPOINT_FILE, "rb") as f:
            checkpoint = pickle.load(f)
        params = checkpoint["params"]
        m = checkpoint["m"]
        v = checkpoint["v"]
        step = checkpoint["step"]
        start_epoch = checkpoint["epoch"]
    else:
        print("⚠️ Nouveau modèle")
        params, m, v, step, start_epoch, _, _ = reset_and_init_model(
            SAVE_PATH, fr_vocab, HIDDEN1, HIDDEN2, en_vocab
        )

# ===========================================================
# 4️⃣ ENTRAINEMENT
# ===========================================================
params = train_model(
    X_train,
    Y_train,
    params,
    HIDDEN1,
    HIDDEN2,
    len(en_vocab),
    epochs=EPOCHS,
    lr=LEARNING_RATE,
    clip=CLIP_VALUE,
    batch_size=32,
    checkpoint_file=CHECKPOINT_FILE
)

# ===========================================================
# 5️⃣ SAUVEGARDE FINALE
# ===========================================================
with open(FINAL_MODEL_FILE, "wb") as f:
    pickle.dump({
        "params": params,
        "merges_fr": merges_fr,
        "fr_vocab": fr_vocab,
        "inv_en_vocab": inv_en_vocab
    }, f)
print(f"💾 Modèle final sauvegardé dans {FINAL_MODEL_FILE}")

# ===========================================================
# 6️⃣ TEST TRADUCTION
# ===========================================================
phrase = "je suis étudiant"
print("\n==============================")
print("Source:", phrase)
print("Traduction:", translate(phrase, params, merges_fr, fr_vocab, inv_en_vocab))

if __name__ == "__main__":
    from google.colab import drive
    import os
    import pickle
    import numpy as np
    from google.colab import files

    # -----------------------------
    # 🔹 Monter Google Drive
    # -----------------------------
    drive.mount('/content/drive')

    SAVE_PATH = "/content/drive/MyDrive/"
    CHECKPOINT_FILE = os.path.join(SAVE_PATH, "checkpoint.pkl")
    DATASET_FILE = os.path.join(SAVE_PATH, "dataset.pkl")
    BPE_FILE = os.path.join(SAVE_PATH, "bpe_data.pkl")
    FINAL_MODEL_FILE = os.path.join(SAVE_PATH, "model_final.pkl")
    FLASK_MODEL_FILE = os.path.join(SAVE_PATH, "mon_modele_traduction.pkl")

    # -----------------------------
    # 🔹 Charger BPE
    # -----------------------------
    if os.path.exists(BPE_FILE):
        print("✅ Chargement BPE...")
        with open(BPE_FILE, "rb") as f:
            bpe_data = pickle.load(f)
        merges_fr = bpe_data["merges_fr"]
        merges_en = bpe_data["merges_en"]
        fr_vocab = bpe_data["fr_vocab"]
        en_vocab = bpe_data["en_vocab"]
        inv_en_vocab = bpe_data["inv_en_vocab"]
    else:
        raise ValueError("⚠️ BPE non trouvé → lancer le block 1")

    # -----------------------------
    # 🔹 Charger dataset
    # -----------------------------
    if os.path.exists(DATASET_FILE):
        print("✅ Chargement dataset...")
        with open(DATASET_FILE, "rb") as f:
            dataset = pickle.load(f)
        X_train = dataset["X_train"]
        Y_train = dataset["Y_train"]
    else:
        raise ValueError("❌ Dataset introuvable. Lance le block 1 pour créer le dataset.")

    # -----------------------------
    # 🔹 Vérifier checkpoint
    # -----------------------------
    params = None
    m, v = None, None
    step = 0
    start_epoch = 0

    if os.path.exists(CHECKPOINT_FILE):
        print("✅ Chargement checkpoint...")
        with open(CHECKPOINT_FILE, "rb") as f:
            checkpoint = pickle.load(f)
        params = checkpoint["params"]
        m = checkpoint["m"]
        v = checkpoint["v"]
        step = checkpoint["step"]
        start_epoch = checkpoint["epoch"]
        print(f"✅ Chargé → step {step} | epoch {start_epoch}")
    else:
        print("⚠️ Aucun checkpoint trouvé → nouveau modèle")
        params = init_params(len(fr_vocab), HIDDEN1, HIDDEN2, len(en_vocab))
        m, v = init_adam(params)

    # -----------------------------
    # 🔹 Entraînement
    # -----------------------------
    params = train_model(
        X_train,
        Y_train,
        params,
        HIDDEN1,
        HIDDEN2,
        len(en_vocab),
        epochs=EPOCHS,
        lr=LEARNING_RATE,
        clip=CLIP_VALUE,
        batch_size=32,
        checkpoint_file=CHECKPOINT_FILE
    )

    # -----------------------------
    # 🔹 Sauvegarde finale
    # -----------------------------
    with open(FINAL_MODEL_FILE, "wb") as f:
        pickle.dump({
            "params": params,
            "merges_fr": merges_fr,
            "fr_vocab": fr_vocab,
            "inv_en_vocab": inv_en_vocab
        }, f)
    print(f"💾 Modèle final sauvegardé → {FINAL_MODEL_FILE}")

    # -----------------------------
    # Export pour Flask
    # -----------------------------
    with open(FLASK_MODEL_FILE, "wb") as f:
        pickle.dump({
            "params": params,
            "merges_fr": merges_fr,
            "fr_vocab": fr_vocab,
            "inv_en_vocab": inv_en_vocab
        }, f)
    print(f"💾 Modèle prêt pour Flask / VS Code → {FLASK_MODEL_FILE}")

    # -----------------------------
    #  telechargement SUR LE PC
    # -----------------------------
    import shutil
    local_copy = "/content/mon_modele_traduction.pkl"
    shutil.copy(FLASK_MODEL_FILE, local_copy)
    print("📥 Téléchargement du modèle vers votre ordinateur...")
    files.download(local_copy)
    print("✅ Téléchargement terminé !")

    # -----------------------------
    # 🔹 Test rapide
    # -----------------------------
    phrase = "comment tu vas"
    print("\n==============================")
    print("Source:", phrase)
    print("Traduction:", translate(phrase, params, merges_fr, fr_vocab, inv_en_vocab))
`


const algorithmeVisu = `import React, { useState, useEffect, useCallback } from 'react';
import BarChart from '../components/BarChart';
// import Accueil from '../page/Accueil'
import { Link } from "react-router-dom";



// Constante pour les données initiales
const INITIAL_DATA = [55, 140, 95, 180, 75, 210, 45, 160, 120, 85, 200, 60, 130, 170, 35,
    150, 100, 190, 70, 220, 90, 145, 50, 175, 110, 205, 65, 155, 125]

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// fonction qui genere toutes les étapes du tri pour un tableau donné
const genererEtapesTriBulles = (tableauInitial) => {
    let etapes = []
    let arr = [...tableauInitial]
    let indicesTries = []

    // Étape initiale du graphique 
    etapes.push({ array: [...arr], comparing: [], swapping: [], sorted: [] })

    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            // Étape de comparaison avec le couleur jaune
            etapes.push({
                array: [...arr],
                comparing: [j, j + 1],
                swapping: [],
                sorted: [...indicesTries]
            });

            if (arr[j] > arr[j + 1]) {
                // Étape d'échange couleur rouge 
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;

                etapes.push({
                    array: [...arr],
                    comparing: [],
                    swapping: [j, j + 1],
                    sorted: [...indicesTries]
                });
            }
        }
        // À la fin de chaque boucle tri le dernier element 
        indicesTries.push(arr.length - i - 1)
        etapes.push({
            array: [...arr],
            comparing: [],
            swapping: [],
            sorted: [...indicesTries]
        })
    }
    // Le premier élément est aussi trié à la fin
    indicesTries.push(0);
    etapes.push({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: [...indicesTries]
    });

    return etapes
}

export default function Visualisateur() {
    const [LoginOpen, setIsLoginOpen] = useState(false)
    const [SignupOpen, setSignupOpen] = useState(false)
    const [vitesse, setVitesse] = useState(1)
    const [optionVisualisation, setOptionVisualisation] = useState(true)
    const [randomGraph, setRandomGraph] = useState(false)

    // Animmation couleur
    const [currentData, setCurrentData] = useState({
        array: [...INITIAL_DATA],
        comparing: [],
        swapping: [],
        sorted: []
    })
    const [allSteps, setAllSteps] = useState([])
    const [etape, setEtape] = useState(0)
    const [play, setPlay] = useState(false)

    // --- GÉNÉRATION DES ÉTAPES POUR LE GRAPHIQUE CLASSIQUE AU MONTAGE 
    useEffect(() => {
        const etapes = genererEtapesTriBulles(INITIAL_DATA)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
    }, [])

    // ANIMATION 
    useEffect(() => {
        if (play && etape < allSteps.length - 1) {
            const delai = Math.max(10, 500 - (vitesse * 6.5))
            const timer = setTimeout(() => {
                setEtape(prev => prev + 1)
                setCurrentData(allSteps[etape + 1])
            }, delai)
            return () => clearTimeout(timer)
        } else if (etape >= allSteps.length - 1) {
            setPlay(false)
        }
    }, [play, etape, allSteps, vitesse])

    // couleur
    const getColors = () => {
        return currentData.array.map((_, index) => {
            if (currentData.swapping.includes(index)) return '#ef4444'
            if (currentData.comparing.includes(index)) return '#eab308'
            if (currentData.sorted.includes(index)) return '#22c55e'
            return '#3b82f6'
        })
    }

    // RESET
    const handleReset = () => {
        setPlay(false)
        setEtape(0)
        setCurrentData(allSteps[0] || {
            array: [...INITIAL_DATA],
            comparing: [],
            swapping: [],
            sorted: []
        })
    }

    // Dernier etape graphique 
    const handleEnd = () => {
        setPlay(false)
        const dernierIndice = allSteps.length > 0 ? allSteps.length - 1 : 0
        setEtape(dernierIndice)
        setCurrentData(allSteps[dernierIndice])
    }

     // Pause 
    const handlePlayPause = () => {
        if (etape >= allSteps.length - 1) {
            setEtape(0)
            setCurrentData(allSteps[0])
            setPlay(true)
        } else {
            setPlay(!play)
        }
    }

    // Changer de graphique 
    const graphiqueChoise = () => {
        const etapes = genererEtapesTriBulles(INITIAL_DATA)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
        setOptionVisualisation(true)
        setRandomGraph(false)
    }

    // Génère pour la partie aleatoire 
    const genererGraphiqueRandom = () => {
        const tableauAleatoire = Array.from({ length: 29 }, () => randomInt(0, 200))
        const etapes = genererEtapesTriBulles(tableauAleatoire)
        setAllSteps(etapes)
        setCurrentData(etapes[0])
        setEtape(0)
        setPlay(false)
    }

    // Premier graph aleatoire
    const graphiqueRandom = () => {
        genererGraphiqueRandom()
        setOptionVisualisation(false)
        setRandomGraph(true)
    }

    const openLogin = () => setIsLoginOpen(true)
    const closeLogin = () => setIsLoginOpen(false)

    const openSignup = () => setSignupOpen(true)
    const closeSignup = () => setSignupOpen(false)

    const openLoginCloseSignup = () => {
        closeSignup()
        setTimeout(() => {
            openLogin()
        }, 500)
    }

    const openSignupCloseLogin = () => {
        closeLogin()
        setTimeout(() => {
            openSignup()
        }, 500)
    }

    return (
        <>
            <div className="relative w-full ">
                <div className="p-6 bg-white/30 text-gray-600/80 shadow-lg rounded-lg mt-[20px] w-[96%] ml-[2%] sm:w-[90%] 
                sm:ml-[5%] md:w-[85%] md:ml-[6%] lg:w-[80%] lg:ml-[10%] xl:w-[85%] xl:ml-[6%]">
                    <ul className="flex flex-wrap gap-2 text-[0.7rem] md:text-[1rem] font-semibold">
                        <h4 className="hover:text-indigo-500 cursor-pointer">
                            <Link to="/" onClick={() => setMobileMenu(false)}>Accueil</Link>
                        </h4>
                        <span className="font-bold">→</span>
                        <h4 className="hover:text-indigo-500 cursor-pointer">Graphique</h4>
                        <span className="font-bold">→</span>
                        <h4 className="text-red-400 hover:opacity-70 cursor-pointer" onClick={openSignup}>
                            Sign up
                        </h4>
                        <span className="font-bold">→</span>
                        <h4 className="hover:text-indigo-500 cursor-pointer" onClick={openLogin}>
                            Login
                        </h4>
                        <span className="">→</span>
                        <h4 className="ml-4">Visulisateur d'algorithme</h4>
                    </ul>

                    <h1 className="text-[1.3rem] md:text-[2rem] lg:text-[2.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 font-bold mt-4 mb-6 text-center">
                        Algorithme visualisation
                    </h1>
                    <h4 className="text-center mt-3 text-sm ">
                        Projet interactif de visualisation d’algorithmes qui permet d’afficher
                        étape par étape le fonctionnement de méthodes de tri, de
                        recherche ou de parcours de graphes à l’aide d’animations et de barres colorées.
                    </h4>

                    <div>
                        <div className="flex flex-col md:flex-row p-2 mt-8 px-4 gap-[2%] mt-4 max-w-[95%] mx-auto">
                            <div className="flex flex-col w-full md:w-[25%] mb-4 md:mb-0">
                                <div className="flex flex-col gap-2 w-[100%] border-2 rounded-lg bg-blue-100/90 p-2 h-[140px]">
                                    <p className="pl-2 pt-2 px-4 text-blue-800/60 font-medium text-[0.8rem]">
                                        Version visualisation
                                    </p>
                                    <button
                                        onClick={graphiqueChoise}
                                        className={text-center text-[0.9rem] font-bold rounded-lg py-2 $/{optionVisualisation ? 'bg-blue-600 text-white' : ''}}>
                                        Graphique visualisation
                                    </button>
                                    <button
                                        onClick={graphiqueRandom}
                                        className={text-center text-[0.9rem] font-bold rounded-lg py-2 $/{randomGraph ? 'bg-blue-600 text-white' : ''}}>
                                        🎲 Random Graphique
                                    </button>
                                </div>


                                {/* Page pour le graphique classique  */}
                                {optionVisualisation && (
                                    <div className="border-2 mt-[30px] pt-[15px] h-[180px] rounded-lg">
                                        <ul className="flex gap-4 text-white font-bold px-2">
                                            <button onClick={handleReset}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                <i className="fi fi-ss-rewind mt-[2px]"></i>Reset
                                            </button>
                                            <button onClick={handlePlayPause} className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                <i className={fi $/{play ? 'fi-sr-pause' : 'fi-sr-play-circle'} mt-[2px]}></i>
                                                {play ? 'Pause' : 'Play'}
                                            </button>
                                            <button onClick={handleEnd}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                End<i className="fi fi-ss-forward mt-[2px]"></i>
                                            </button>
                                        </ul>
                                        <p className="mt-4 text-[0.8rem] ml-3">Gérer la vittesse du graphique</p>
                                        <p className="text-[0.8rem] ml-3">Speed : {vitesse}</p>
                                        <input
                                            onChange={(e) => setVitesse(Number(e.target.value))}
                                            className="ml-4 mt-2 w-[90%]"
                                            value={vitesse}
                                            type="range"
                                            min="1"
                                            max="100"
                                        />
                                    </div>
                                )}

                                {/* Page pour le graphique aléatoire  */}
                                {randomGraph && (
                                    <div className="border-2 mt-[30px] pt-[15px] h-[180px] rounded-lg">
                                        <ul className="flex gap-4 text-white font-bold px-2">
                                            <button
                                                onClick={handleReset}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                <i className="fi fi-ss-rewind mt-[2px]"></i>Reset
                                            </button>
                                            <button onClick={handlePlayPause}
                                                className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                <i className={fi $/{play ? 'fi-sr-pause' : 'fi-sr-play-circle' } mt-[2px]}></i>
                                                {play ? 'Pause' : 'Play'}
                                            </button>
                                            <button onClick={handleEnd} className="flex text-blue-600 gap-2 hover:bg-blue-600 hover:text-white rounded-lg w-[100%]">
                                                End<i className="fi fi-ss-forward mt-[2px]"></i>
                                            </button>
                                        </ul>
                                        <p className="mt-4 text-[0.8rem] ml-3">Gérer la vittesse du graphique</p>
                                        <p className="text-[0.8rem] ml-3">Speed : {vitesse}</p>
                                        <div className="flex flex-col w-full">
                                            <input onChange={(e) => setVitesse(Number(e.target.value))}
                                                className="ml-5 mr-6 mt-2 w-[90%]"
                                                value={vitesse}
                                                type="range"
                                                min="1"
                                                max="100"/>
                                            <button onClick={genererGraphiqueRandom} className="border-2 rounded-lg px-2 mt-2 w-[70%] ml-[10%] hover:opacity-60">
                                                Random
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col flex-auto border-2 rounded-lg p-2 h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
                                {/* Légende du graphique  */}
                                <div className="flex flex-wrap justify-center gap-4 mt-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                        <span className="text-sm">Non trié</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                        <span className="text-sm">Comparaison</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                                        <span className="text-sm">Échange</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-sm">Trié</span>
                                    </div>
                                </div>

                                {/* Graphique selon le mode */}
                                <div className="p-2 flex-1 flex justify-center items-end">
                                    <BarChart
                                        values={currentData.array}
                                        colors={getColors()}
                                        step={etape}
                                        total={allSteps.length > 0 ? allSteps.length - 1 : 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Background noir semi-transparent pour login */}
            <div className={fixed top-0 left-0 w-full h-full z-40 transition-opacity duration-500 bg-black $/{LoginOpen
                    ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}} onClick={closeLogin}>
                </div>

            <div className={fixed z-50 rounded-[1rem] border-[1px] border-white/30 text-white top-[1rem] transition-all duration-500 ease-in-out flex flex-col backdrop-blur-md
                w-[90%] sm:w-[80%] md:w-[70%] lg:w-[50%] xl:w-[35%] 2xl:w-[30%] h-[80vh] overflow-y-auto 
                $/{ LoginOpen ? 'right-[1rem] opacity-100 pointer-events-auto' : 'right-[-40%] opacity-0 pointer-events-none'}}
                style={{ background: 'rgba(38, 48, 127, 0.9)' }}>
                <div className="flex justify-between mx-5 mt-3">
                    <h3 className="font-bold text-[1.5rem]">Login</h3>
                    <h3 className="text-[2rem] opacity-80 cursor-pointer -mt-2" onClick={closeLogin}>
                        ×
                    </h3>
                </div>

                <h6 className="text-[0.8rem] opacity-80 mt-8 mx-5">
                    Pour vous enregistrer mettez votre identifiant et mot de passe. En cas de perte du mot de passe
                    cliquer mot de passe oublié.
                </h6>

                <div className="mt-8 flex-1 px-5 space-y-4">
                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Identifiant</h4>
                        <input
                            placeholder="Mettez votre identifiant" style={{ background: '#514c4c80' }}
                            type="text" className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"/>
                    </div>

                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Mot de passe</h4>
                        <input
                            placeholder="Mettez votre mot de passe" style={{ background: '#514c4c80' }}
                            type="password" className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"/>
                    </div>
                </div>

                <div style={{ background: '#6372ff' }}
                    className="rounded-b-[1rem] p-6 flex flex-col items-center space-y-4">
                    <hr className="border-white/20 w-full" />
                    <div className="flex gap-6">
                        <button
                            className="border border-white font-bold hover:bg-white hover:text-black transition-colors rounded-lg w-[5rem] py-1">
                            Login
                        </button>
                        <button
                            onClick={openSignupCloseLogin}
                            className="font-bold hover:opacity-70 px-6 py-1 bg-white/10 rounded-lg border border-white/30">
                            Sign up
                        </button>
                    </div>
                </div>
            </div>



            {/* Background pour Sign up */}
            <div
                className={fixed top-0 left-0 w-full h-full z-40 transition-opacity duration-500 bg-black $/{SignupOpen
                        ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}}
                onClick={closeSignup}></div>

            {/* Page de Sign up */}
            <div
                className={fixed z-50 rounded-[1rem] border-[1px] border-white/30 text-white top-[1rem] transition-all duration-500 ease-in-out flex flex-col backdrop-blur-md
                 w-[90%] sm:w-[80%] md:w-[70%] lg:w-[50%] xl:w-[35%] 2xl:w-[30%] h-[80vh] overflow-y-auto
                 $/{SignupOpen ? 'right-[1rem] opacity-100 pointer-events-auto' : 'right-[-40%] opacity-0 pointer-events-none'
                    }} style={{ background: 'rgba(38, 48, 127, 0.9)' }}>
                <div className="flex justify-between mx-5 mt-3">
                    <h3 className="font-bold text-[1.5rem]">Sign up</h3>
                    <h3 className="text-[2rem] opacity-80 cursor-pointer -mt-2" onClick={closeSignup}>
                        ×
                    </h3>
                </div>

                <h6 className="text-[0.8rem] opacity-80 mt-8 mx-5">
                    Crée votre identifiant et votre mot de passe
                </h6>

                <div className="mt-8 flex-1 px-5 space-y-4">
                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Identifiant</h4>
                        <input
                            placeholder="Cree votre identifiant"
                            style={{ background: '#514c4c80' }}
                            type="text"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <h4 className="opacity-80 text-[0.9rem]">* Crée de passe</h4>
                        <input
                            placeholder="Cree votre mot de passe"
                            style={{ background: '#514c4c80' }}
                            type="password"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                        <h4 className="opacity-80 text-[0.9rem]">* Remettre de passe</h4>
                        <input
                            placeholder="Résseyer votre mot de passe"
                            style={{ background: '#514c4c80' }}
                            type="password"
                            className="rounded-[6px] border border-white/60 py-[7px] w-full p-2 text-[0.9rem] outline-none"
                        />
                    </div>
                </div>

                <div
                    style={{ background: '#6372ff' }}
                    className="rounded-b-[1rem] p-6 flex flex-col items-center space-y-4"
                >
                    <hr className="border-white/20 w-full" />
                    <div className="flex gap-6">
                        <button
                            onClick={openLoginCloseSignup}
                            className="border border-white font-bold hover:bg-white hover:text-black transition-colors rounded-lg w-[5rem] py-1"
                        >
                            Login
                        </button>
                        <button className="font-bold hover:opacity-70 px-6 py-1 bg-white/10 rounded-lg border border-white/30">
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
}`

 // Fonction pour ajouter les numéros de ligne
  const addLineNumbers = (code) => {
    const lines = code.split('\n')

    return lines.map((line, index) => (
      <div key={index} className="flex hover:bg-zinc-800/50">
        <span className="text-right pr-4 select-none text-zinc-500 min-w-[3rem] border-r border-zinc-700">
          {index + 1}
        </span>
        <span className="pl-4 whitespace-pre">{line || ' '}</span>
      </div>
    ))
  };

  const handleCopyNetwork = () => {
    navigator.clipboard.writeText(codeReseaux)
    setCopiedReact(true)
    setTimeout(() => setCopiedReact(false), 2500)
  }

  const handleCopyAlgo = () => {
    navigator.clipboard.writeText(algorithmeVisu)
    setCopiedNetwork(true)
    setTimeout(() => setCopiedNetwork(false), 2500)
  }

  return (
    <>
      <div className="flex flex-col md:grid md:grid-cols-2 gap-[60px] mt-[100px]">
        <div className="flex flex-col ml-[5%] md:ml-[5%] mr-[5%] md:mr-0">
          <p className="mr-[5%] md:mr-0 text-[0.9rem] text-gray-700">
            Ce visualisateur d'algorithmes a été créé par moi-même en React.js. Je n'ai pas développé tout le code à 100%, le changement de couleur a d'abord été initialisé par l'IA, car je ne comprenais pas encore le concept d'un visualisateur. Après avoir vu la structure du code, j'ai compris son fonctionnement et j'ai recréé le projet en y ajoutant des fonctionnalités comme la vitesse de l'animation.
            <br /><br />
            Toutes les pages de ce site ont été entièrement réalisées par moi-même (avec de temps en temps, des erreurs de structure), à part la partie sur les réseaux de neurones, qui a été générée en première partie par l'IA. Si vous avez vu le projet avant le 7 juin, vous avez vu cette première version.
            <br /><br />
            Après le 7 avril, j'ai repris le code, changé le style et créé une page avec un meilleur design, la connexion avec le backend à été initialisée en première partie par l'IA et n'a pas été changé.
          </p>
          <h1 className="text-center pb-8 mt-8 font-extrabold text-[1.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
            Visualisateur d'algorithme
          </h1>
          <div className="bg-zinc-900 text-zinc-100 rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden h-[400px] overflow-y-auto">
        
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 sticky top-0 bg-zinc-900">
              <span className="text-sm font-medium text-zinc-300">JavaScript</span>
              <button
                onClick={handleCopyNetwork}
                className="p-2 rounded-lg hover:bg-zinc-800 transition">
                <span className="material-symbols-outlined text-base">content_copy</span>
              </button>
            </div>

            {/* Code avec numéros de ligne */}
            <div className="text-sm font-mono">
              {addLineNumbers(algorithmeVisu)}
            </div>

            {/* Copied message */}
            {copiedReact && (
              <div className="text-green-400 text-xs px-4 pb-2 sticky bottom-0 bg-zinc-900">
                text Copié 
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col mr-[5%] md:mr-[5%] ml-[5%] md:ml-0">
          <p className="mr-[5%] md:mr-0 text-[0.9rem] text-gray-700">
            J'ai commencé par télécharger le dataset de traduction français-anglais depuis le site manythings.org, qui contient 175 000 phrases.<br />
             Ensuite, j'ai appliqué un nettoyage des textes pour séparer les données avant d'apprendre deux modèles BPE distincts, l'un pour le français et l'autre en anglais, le model a tokenisé  3 019 tokens pour le français et 2 975 tokens pour l'anglais.
              J'ai fixé une longueur maximale de 20 tokens par phrase.
             J'ai entrainée sur 75 000 phrases après avoir mélangé aléatoirement les données.
             <br /> <br />
             J'ai créé un réseau de neurones de type RNN avec une architecture encodeur-décodeur composée d'une couche dans l'encodeur et d'une couche dans le décodeur. <br /> Mon modèle a deux couches cachées pour capturer les dépendances temporelles, ainsi qu'une couche d'attention qui permet au décodeur de se concentrer sur les parties pertinentes de la phrase source lors de la génération de chaque token cible. Enfin, j'ai ajouté une
              couche de sortie qui projette les représentations cachées vers l'espace du vocabulaire anglais.
             <br />
             Pour les fonctions d'activation, j'ai utilisé la fonction tanh, GeLU, softmax
             <br />
             Pour l'optimisation, j'ai utilisé la descente de gradient de type mini-batch avec l'optimiseur Adam et j'ai choisi la 
             fonction de perte MSE pour mesurer l'erreur entre les prédictions et les cibles.
             <br /> <br />
              Comme l'entraînement du réseau était excessivement long, j'ai créé un modèle PyTorch. Je ne maîtrise pas encore cette librairie j'ai simplement copié-collé mon code et demandé à une IA de le convertir en PyTorch. Comme le réseau sur PyTorch ne converge pas, le modèle ne sera disponible que le 10 avril. Le réseau 
              actuel n'est entraîné que sur 1 000 phrases, il n'est donc pas optimal il sert uniquement à initialiser la page réseau.

              <br /> <br />
             Le code de la BPE et l’enregistrement du modèle pour le télécharger sur mon ordinateur ont été donnés par l’IA.
             J’ai fait la partie réseau de neurones, l’initialisation et la fonction forward étaient à peu près correctes, mais la back et la partie entraînement contenaient pas mal d’erreurs que l’IA a corrigées.
             Une bonne partie du code n'est pas le réseaux mais l'enregistrement par steps du modèle, la sauvgarde ect ...
              </p>
             
          <h1 className="text-center pb-8 mt-8 font-extrabold text-[1.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
            Code réseaux de neurones
          </h1>
          <div className="bg-zinc-900 text-zinc-100 rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden h-[400px] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 sticky top-0 bg-zinc-900">
              <span className="text-sm font-medium text-zinc-300">Python</span>
              <button
                onClick={handleCopyAlgo}
                className="p-2 rounded-lg hover:bg-zinc-800 transition">
                <span className="material-symbols-outlined text-base">content_copy</span>
              </button>
            </div>

            {/* Code avec numéros de ligne */}
            <div className="text-sm font-mono">
              {addLineNumbers(codeReseaux)}
            </div>

            {/* Copied message */}
            {copiedNetwork && (
              <div className="text-green-400 text-xs px-4 pb-2 sticky bottom-0 bg-zinc-900">
                text Copié !
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}