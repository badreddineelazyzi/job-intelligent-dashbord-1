from sentence_transformers import SentenceTransformer, InputExample
import sentence_transformers.losses as losses
from torch.utils.data import DataLoader
import torch

class EmbeddingManager:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        # On charge le modèle (il peut être local après fine-tuning)
        self.model = SentenceTransformer(model_name)

    def encode_text(self, texts):
        # Transforme une liste de textes en vecteurs
        return self.model.encode(texts, convert_to_tensor=True)

    def fine_tune(self, train_data, output_path="./fine_tuned_model"):
        """
        train_data: liste de paires (titre, description) ou (query, positive_doc)
        """
        train_examples = [InputExample(texts=[t[0], t[1]]) for t in train_data]
        train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=32)
        
        # Utilisation d'une perte adaptée pour le matching (MultipleNegativesRankingLoss)
        train_loss = losses.MultipleNegativesRankingLoss(model=self.model)

        self.model.fit(
            train_objectives=[(train_dataloader, train_loss)], 
            epochs=10,             
            warmup_steps=200,      
            optimizer_params={'lr': 3e-5}, 
            weight_decay=0.05,     
            output_path=output_path
        )
        self.model.save(output_path)
        print(f"Modèle sauvegardé sous : {output_path}")