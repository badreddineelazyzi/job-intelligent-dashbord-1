from sentence_transformers import util


def compute_similarity(query_vector, corpus_vectors):
    """
    Calcule la proximité entre la requête et toutes les offres.
    Retourne les scores de similarité.
    """
    return util.cos_sim(query_vector, corpus_vectors)[0]