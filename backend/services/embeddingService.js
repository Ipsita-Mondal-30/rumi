import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service to convert text to vector embeddings using Gemini model(gemini-embedding-001).
 */

let genAI = null;

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set in environment');
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

/**
 * Generates a vector embedding for the given text.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} - The vector embedding (768 dimensions for text-embedding-001).
 */
export async function getEmbedding(text, retries = 5, delay = 3000) {
  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });

    // The embedding request using stable format and explicit 768 dimensions
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    });

    // checking if embedding exists
    if (!result || !result.embedding || !result.embedding.values) {
      throw new Error('Embedding response invalid: result.embedding.values not found');
    }

    const embedding = result.embedding.values;
    // embedding is a non-empty array
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(`Invalid embedding generated: Expected non-empty array, got ${typeof embedding}`);
    }
    return embedding;
  } catch (error) {
    if (retries > 0 && String(error?.message || '').includes('429')) {
      console.warn(`Rate limit hit (429). Retrying in ${delay / 1000}s... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return getEmbedding(text, retries - 1, delay * 2);
    }
    console.error('Error generating embedding:', error?.message || error);
    throw error;
  }
}

/**
 * Generates embeddings for a batch of texts.
 * Uses a sequence to avoid unsupported batch API and handles rate limiting.
 */
export async function getBatchEmbeddings(texts) {
  try {
    const embeddings = [];

    // process each text one by one
    for (const text of texts) {
      const emb = await getEmbedding(text);
      embeddings.push(emb); // saved in embeddings array

      // Increased delay (3s) for the strict free-tier rate limits (429 errors)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error?.message || error);
    throw error;
  }
}
