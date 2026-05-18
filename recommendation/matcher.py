import os
try:
    import spacy
except ImportError:
    spacy = None
import torch
from .embeddings import EmbeddingManager
from .cosine_similarity import compute_similarity

from sentence_transformers import CrossEncoder

class JobMatcher:
    def __init__(self, model_path="./model_final"):
        if not os.path.exists(model_path):
            print(f'Warning: {model_path} not found. Falling back to default model.')
            self.emb_manager = EmbeddingManager()
        else:
            self.emb_manager = EmbeddingManager(model_path)
        
        # Do not load CrossEncoder at startup — lazy-load on first use to avoid
        # heavy downloads and long startup times.
        self.cross_encoder = None
        self.corpus_embeddings = None
        
        try:
            self.nlp = spacy.load("fr_core_news_lg") 
        except:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                self.nlp = None
                print("Warning: spaCy n'a pas pu être chargé.")

    def precompute_corpus(self, corpus_texts):
        print(f"Encodage sémantique de {len(corpus_texts)} offres...")
        self.corpus_embeddings = self.emb_manager.encode_text(corpus_texts)
        return self.corpus_embeddings

    def _get_cross_encoder(self):
        """Lazy-load the CrossEncoder model when needed.

        This avoids downloading/loading large models during app startup.
        """
        if self.cross_encoder is None:
            # ensure HF cache is in project folder to persist between restarts
            hf_cache = os.path.join(os.getcwd(), ".hf_cache")
            os.environ.setdefault("HF_HOME", hf_cache)
            os.environ.setdefault("TRANSFORMERS_CACHE", hf_cache)
            print("Loading CrossEncoder model (this may take a while)...")
            self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        return self.cross_encoder

    def match(self, query, offers_df, top_k=5):
        # 1. Extraction d'entités (Skills)
        skills_detected = []
        if self.nlp:
            doc = self.nlp(query)
            skills_detected = [ent.text for ent in doc.ents]
        
        # 2. Encodage de la query
        
        poids_query = (query + " ") * 3 
        query_vec = self.emb_manager.encode_text([poids_query])
        
        # 3. Sécurité pour le corpus
        if self.corpus_embeddings is None:
            print("Warning: Corpus non pré-calculé...")
            corpus_texts = offers_df['combined_features'].tolist()
            self.corpus_embeddings = self.emb_manager.encode_text(corpus_texts)
        
        # 4. ÉTAPE 1: Cosine Similarity (Bi-Encoder) - SRI3A
        scores = compute_similarity(query_vec, self.corpus_embeddings)
        
        
        offers_df = offers_df.copy()
        # On crée la colonne 'score' AVANT de l'utiliser pour trier
        offers_df['score'] = scores.cpu().numpy() if torch.is_tensor(scores) else scores
        
        # On prend les 50 meilleures selon le Bi-Encoder
        top_50 = offers_df.sort_values(by='score', ascending=False).head(50)
        # ---------------

        # 5. ÉTAPE 2: Re-ranking (Cross-Encoder) - D9IQA
        print(f"Re-ranking des 50 meilleurs candidats pour : '{query}'")
        pairs = [[query, doc] for doc in top_50['combined_features'].tolist()]
        
        # Le Cross-Encoder prédit la pertinence réelle (lazy-loaded)
        cross_encoder = self._get_cross_encoder()
        cross_scores = cross_encoder.predict(pairs)
        top_50['score'] = cross_scores
        
        # Tri final avec les scores du Cross-Encoder
        results = top_50.sort_values(by='score', ascending=False).head(top_k)
        
        return results, skills_detected