import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEmbedding } from './embeddingService.js';
import { queryIndex } from './pineconeService.js';

/**
 * Service to orchestrate the RAG flow.
 */

const THRESHOLD = 0.75;

export async function getRAGReply(userQuery) {
  try {
    // 1. Get vector embedding for the user query
    const queryVector = await getEmbedding(userQuery);

    // 2. Send this vector and Query Pinecone for top 5 relevant context
    const searchResults = await queryIndex(queryVector, 5);

    // 3. Filter results based on threshold and construct context
    if (!searchResults.matches || searchResults.matches.length === 0 || searchResults.matches[0].score < THRESHOLD) {
      return "I do not have information regarding this. Try asking something related to Rumi.";
    }

    const context = searchResults.matches
      .map((match) => `Q: ${match.metadata.question}\nA: ${match.metadata.answer}`)
      .join('\n\n');

    // 4. Generate response using Gemini with strict prompt
    const reply = await generateGroundedResponse(userQuery, context);
    return reply;
  } catch (error) {
    console.error('RAG Service Error:', error?.message || error);
    throw error;
  }
}

async function generateGroundedResponse(query, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `You are Rumi Assistant.

Answer ONLY using the provided context.

Rules:
* Do not make up information
* If answer is not in context, say "I don't have information regarding this. Try asking something related to Rumi."
* Keep answers short and practical
* Be helpful and friendly

Context:
${context}

Question:
${query}`;

  // Fallback models
  const modelCandidates = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  function isModelNotFoundError(err) {
    const msg = String(err?.message || '').toLowerCase();
    return msg.includes('not found') || msg.includes('is not supported for generatecontent');
  }

  let lastErr = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response?.text?.()?.trim();
      if (text) return text;

      // fallback if text missing
      return 'Sorry, I encountered an error while generating a response.';
    } catch (err) {
      lastErr = err;
      if (isModelNotFoundError(err)) {
        console.warn(`[RAG] model '${modelName}' unavailable, trying next candidate...`);
        continue;
      }
      console.error('Gemini Generation Error:', err?.message || err);
      return 'Sorry, I encountered an error while generating a response.';
    }
  }

  console.error('Gemini Generation Error: no model candidates succeeded', lastErr?.message || '');
  return 'Sorry, I encountered an error while generating a response.';
}
