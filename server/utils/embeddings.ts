import { pipeline } from '@xenova/transformers';

let embedder: any = null;

export const getEmbedding = async (text: string) => {
  if (!embedder) {
    // model matches the one used in data population (all-mpnet-base-v2 is 768-dim)
    embedder = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');
  }

  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};
