from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TFIDFMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()

    def fit_predict(self, query, corpus):
        tfidf_matrix = self.vectorizer.fit_transform(corpus)
        query_vec = self.vectorizer.transform([query])
        return cosine_similarity(query_vec, tfidf_matrix)[0]