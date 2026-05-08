
import os
from recommendation.matcher import JobMatcher

print('Checking if matcher needs fix...')
with open('recommendation/matcher.py', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import os' not in content:
    content = 'import os\n' + content

if 'self.emb_manager = EmbeddingManager(model_path)' in content:
    new_init = '''        if not os.path.exists(model_path):
            print(f'Warning: {model_path} not found. Falling back to default model.')
            self.emb_manager = EmbeddingManager()
        else:
            self.emb_manager = EmbeddingManager(model_path)'''
    content = content.replace('        self.emb_manager = EmbeddingManager(model_path)', new_init)

with open('recommendation/matcher.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed matcher.py')

