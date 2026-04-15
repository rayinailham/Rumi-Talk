import os

def split_sql():
    base_dir = r'd:\(program-projects)\Rumi-Talk'
    input_path = os.path.join(base_dir, 'scripts', 'update_embeddings_optimized.sql')
    output_dir = os.path.join(base_dir, 'scripts', 'sql_batches')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    batches = content.split('COMMIT;')
    
    for i, batch in enumerate(batches):
        clean_batch = batch.strip()
        if not clean_batch:
            continue
            
        batch_sql = clean_batch + ';\nCOMMIT;'
        output_path = os.path.join(output_dir, f'batch_{i}.sql')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(batch_sql)
        print(f"Generated {output_path}")

if __name__ == "__main__":
    split_sql()
