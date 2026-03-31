import { useState } from "react";

export default function CodeBlock() {
  const [copied, setCopied] = useState(false);

  const codeReseaux = `# ===========================================================
#                       IMPORTS
# ===========================================================
import numpy as np
import pandas as pd
import re
from collections import Counter

# ===========================================================
#              TÉLÉCHARGEMENT DES DONNÉES
# ===========================================================
!wget -nc https://www.manythings.org/anki/fra-eng.zip
!unzip -n fra-eng.zip

data = pd.read_csv(
    "fra.txt",
    sep="\t",
    names=["english", "french", "attr"],
    nrows=140000
)

def clean_text(text):
    text = text.lower()
    return re.sub(r"[^a-zàâçéèêëîïôûùüÿñœ' ]", "", text)

data["english"] = data["english"].apply(clean_text)
data["french"] = data["french"].apply(clean_text)

# ===========================================================
#              BPE (BYTE PAIR ENCODING)
# ===========================================================
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
    # Tronquer ou paddinguer à max_len
    if len(ids) > max_len:
        ids = ids[:max_len]
    else:
        ids = ids + [0] * (max_len - len(ids))
    return ids

# ===========================================================
#               PRÉPARATION DES DONNÉES
# ===========================================================
merges_fr, fr_tokens = learn_bpe(data["french"])
merges_en, en_tokens = learn_bpe(data["english"])

fr_vocab = build_vocab(fr_tokens)
en_vocab = build_vocab(en_tokens)
inv_en_vocab = {v:k for k,v in en_vocab.items()}

MAX_LEN = 20
X = np.array([encode_sentence(s, merges_fr, fr_vocab, MAX_LEN) for s in data["french"]])
Y = np.array([encode_sentence(s, merges_en, en_vocab, MAX_LEN) for s in data["english"]])

vocab_fr_size = len(fr_vocab)
vocab_en_size = len(en_vocab)

print("X fr :", X)
print("Y en :", Y)
print()
print("="*40)
print()
print("fr_vocab", fr_vocab)
print("en_vocab", en_vocab)
print()
print("="*40)
print()
print("vocab_fr_size", vocab_fr_size)
print("vocab_en_size", vocab_en_size)`


const algorithmeVisu = `if (isPlaying && currentStep >= allSteps.length - 1) {
  handleReset();
  // ... suite du code
}`


  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

    return (
        <>
        
        <div className="grid md:grid-cols-2 gap-[60px] mt-[100px]">
            <div className="flex flex-col ml-[5%]">
                <p>J'ai crée un réseaux de neurone RRN model encodeur decodeur 1 couche entre 2 couche 
                    caché dont 1 couche dattention une couche de sortie. La descente de gradient utiliser et la mini batch et et l'obtimiseur adam utiliser
                     la fonction de perte MSE implementer les fonction d'activation tahn  gelu et sotmax.  </p>
                <h1 className="text-center pb-8 mt-8 font-extrabold text-[1.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Visulisateur d'algorithme </h1>
                <div className="bg-zinc-900 text-zinc-100 rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden h-[300px] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
                        <span className="text-sm font-medium text-zinc-300">JavaScript</span>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition">
                            <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                    </div>

                    {/* Code */}
                    <pre className="p-4 text-sm overflow-x-auto">
                        <code className="font-mono whitespace-pre">
                            {algorithmeVisu}
                        </code>
                    </pre>

                    {/* Copied message */}
                    {copied && (
                        <div className="text-green-400 text-xs px-4 pb-2">
                            Copied!
                        </div>
                    )}
                </div>
            </div>


            <div className="flex flex-col mr-[5%]">
                <h1 className="text-center pb-8 mt-8 font-extrabold text-[1.5rem] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Code réseaux de neurones </h1>
                <div className="bg-zinc-900 text-zinc-100 rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden h-[300px] overflow-y-auto ">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
                        <span className="text-sm font-medium text-zinc-300">JavaScript</span>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-zinc-800 transition">
                            <span className="material-symbols-outlined text-base">content_copy</span>
                        </button>
                    </div>

                    {/* Code */}
                    <pre className="p-4 text-sm overflow-x-auto">
                        <code className="font-mono whitespace-pre">
                            {codeReseaux}
                        </code>
                    </pre>

                    {/* Copied message */}
                    {copied && (
                        <div className="text-green-400 text-xs px-4 pb-2">
                            Copied!
                        </div>
                    )}
                </div>
            </div>
        </div>
            
    
    </>
  )
}
