import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Service to handle Pinecone Vector DB operations.
 */

let pineconeClient = null;

function getClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error('PINECONE_API_KEY is not set in environment');

  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Queries the rumi-rag index for top matches.
 * @param {number[]} vector - The query vector.
 * @param {number} topK - Number of results to return.
 * @returns {Promise<any>} - Pinecone search matches.
 */

// searches for the topK matches (most relevant results) from pinecone
export async function queryIndex(vector, topK = 5) {
  try {
    const pc = getClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'rumi-rag';
    const index = pc.index(indexName).namespace('rumi');

    const results = await index.query({
      // sending the query vector to pinecone
      vector,
      topK,
      includeMetadata: true,
    });

    return results;
  } catch (error) {
    console.error('Error querying Pinecone:', error?.message || error);
    throw error;
  }
}

/**
 * Upserts a batch of vectors with metadata to the index.
 * @param {Array<{id: string, values: number[], metadata: any}>} vectors
 */

// saving new vectors to pinecone
export async function upsertVectors(vectors) {
  try {
    const pc = getClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'rumi-rag';
    const index = pc.index(indexName);

    await index.namespace('rumi').upsert({
      // Upsert means insert if the vector is new, or update if it already exists.
      records: vectors,
    });

    console.log(`Pinecone: Successfully upserted ${vectors.length} vectors.`);
  } catch (error) {
    console.error('Error upserting to Pinecone:', error?.message || error);
    throw error;
  }
}
