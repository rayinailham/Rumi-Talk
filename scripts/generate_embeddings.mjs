import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

async function generateEmbeddings() {
    console.log('Loading embedding model...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');

    const quotesPath = path.resolve('scripts/quotes.json');
    const quotes = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));

    console.log(`Generating embeddings for ${quotes.length} quotes...`);
    
    const results = [];
    for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        try {
            const output = await extractor(quote.quote_text, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            
            results.push({
                id: quote.id,
                embedding: embedding
            });

            if ((i + 1) % 50 === 0 || i === quotes.length - 1) {
                console.log(`Processed ${i + 1}/${quotes.length} quotes...`);
            }
        } catch (err) {
            console.error(`Error processing quote ${quote.id}:`, err);
        }
    }

    // Generate SQL update script
    console.log('Generating SQL update script...');
    let sql = '';
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE);
        sql += 'BEGIN;\n';
        for (const item of batch) {
            const vectorStr = `[${item.embedding.join(',')}]`;
            sql += `UPDATE public.rumi_quotes SET embedding = '${vectorStr}' WHERE id = '${item.id}';\n`;
        }
        sql += 'COMMIT;\n\n';
    }

    fs.writeFileSync('scripts/quotes_with_embeddings.json', JSON.stringify(results, null, 2));
    console.log('Embeddings saved to scripts/quotes_with_embeddings.json');

    fs.writeFileSync('scripts/update_embeddings.sql', sql);
    console.log('SQL script saved to scripts/update_embeddings.sql');
}

generateEmbeddings().catch(console.error);
