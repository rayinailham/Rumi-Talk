import json
import os

def generate_optimized_sql():
    # Use absolute path for safety
    base_dir = r'd:\(program-projects)\Rumi-Talk'
    json_path = os.path.join(base_dir, 'scripts', 'quotes_with_embeddings.json')
    output_path = os.path.join(base_dir, 'scripts', 'update_embeddings_optimized.sql')

    with open(json_path, 'r', encoding='utf-8') as f:
        quotes = json.load(f)
    
    # Batch size for SQL UPDATE FROM VALUES
    batch_size = 5
    sql_batches = []
    
    for i in range(0, len(quotes), batch_size):
        batch = quotes[i:i+batch_size]
        
        values_list = []
        for q in batch:
            # Format embedding as a string for pgvector '[...]'
            embedding_str = '[' + ','.join(map(str, q['embedding'])) + ']'
            values_list.append(f"('{q['id']}', '{embedding_str}'::vector)")
        
        values_str = ',\n        '.join(values_list)
        
        sql = f"""
UPDATE public.rumi_quotes AS r
SET embedding = v.embedding
FROM (
    VALUES
        {values_str}
) AS v(id, embedding)
WHERE r.id = (v.id)::uuid;
"""
        sql_batches.append(sql)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for batch_sql in sql_batches:
            f.write("BEGIN;\n")
            f.write(batch_sql)
            f.write("COMMIT;\n\n")

if __name__ == "__main__":
    generate_optimized_sql()
