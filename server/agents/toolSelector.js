import { createEmbedding } from "../ai/embeddingClient.js";
import { cosineSimilarity } from "../utils/vectorUtils.js";
const tools = {
  sales: {
    name: "sales",
    description:
      "Analyzes sales revenue, total sales, orders, customers, products sold, product sales performance, and revenue generated."
  },

  inventory: {
    name: "inventory",
    description:
      "Analyzes inventory stock levels, available stock, out of stock products, shortages, excess stock, and unsold products."
  },

  trends: {
    name: "trends",
    description:
      "Analyzes sales trends, revenue trends, increases, decreases, growth, decline, changes over time, and historical patterns."
  },

  calculator: {
    name: "calculator",
    description:
      "Performs mathematical calculations including profit, profit margin, percentages, totals, differences, averages, and comparisons."
  }
};

export const selectTools = async (question) => {
  const questionEmbedding = await createEmbedding(question);

  const results = [];

  for (const tool of Object.values(tools)) {
    const toolEmbedding = await createEmbedding(tool.description);

    const similarity = cosineSimilarity(
      questionEmbedding,
      toolEmbedding
    );

    results.push({
      tool: tool.name,
      similarity: Number(similarity.toFixed(4))
    });
  }

  results.sort((a, b) => b.similarity - a.similarity);

const topK = 3;

return results
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, topK);};