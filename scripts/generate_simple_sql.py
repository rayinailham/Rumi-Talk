import json
import os

def generate_simple_sql():
    with open('scripts/quotes_with_embeddings.json', 'r', encoding='utf-8') as f:
        quotes = json.load(f)
    
    output_dir = 'scripts/sql_simple'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Batch size of 5 updates per file
    batch_size = 5
    for i in range(0, len(quotes), batch_size):
        batch = quotes[i:i + batch_size]
        sql_content = "BEGIN;\n"
        for q in batch:
            embedding_str = json.dumps(q['embedding'])
            sql_content += f"UPDATE public.rumi_quotes SET embedding = '{embedding_str}'::vector WHERE id = '{q['id']}';\n"
        sql_content += "COMMIT;\n"
        
        with open(f'{output_dir}/simple_{i//batch_size}.sql', 'w', encoding='utf-8') as f:
            f.write(sql_content)
    
    print(f"Generated {len(quotes)//batch_size + 1} simple SQL files.")

if __name__ == "__main__":
    generate_simple_sql()
