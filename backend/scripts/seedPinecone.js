const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { getBatchEmbeddings } = require("../services/embeddingService");
const { upsertVectors } = require("../services/pineconeService");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Script to seed Pinecone with the knowledge base.
 */
async function seed() {
  console.log("Starting Pinecone seeding...");

  try {
    //constructed path to knowledge file using path.join
    const dataPath = path.join(__dirname, "../data/rumi_knowledge.json");
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Knowledge file not found at ${dataPath}`);
    }
//read file using fs
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const knowledge = JSON.parse(rawData);

    console.log(`Loaded ${knowledge.length} entries from dataset.`);

    // 1. Generate embeddings
    // We combine question and answer for a good vector
    const textsToEmbed = knowledge.map(entry => `Question: ${entry.question}\nAnswer: ${entry.answer}`);

    console.log("Generating embeddings...");
    //convert all text to vector
    const embeddings = await getBatchEmbeddings(textsToEmbed);

    // Strict validation -ensuring every dataset entry has a corresonding embedding
    if (embeddings.length !== knowledge.length) {
      throw new Error(`Mismatch between dataset size (${knowledge.length}) and embeddings count (${embeddings.length})`);
    }

    // 2. Format for Pinecone
    const vectors = knowledge.map((entry, index) => ({
      id: entry.id,
      values: embeddings[index],
      metadata: {
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        city: entry.city
      }
    }));

    if (!vectors.length) {
      throw new Error("No valid vectors generated for upsert");
    }

    // 3. Upsert to Pinecone
    console.log("Upserting to Pinecone (namespace: rumi)...");
    await upsertVectors(vectors);

    console.log("Seeding completed successfully! :) ");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();
