import { selectTools } from "./toolSelector.js";

const questions = [
  "Why did customers stop buying rice?",
  "How much revenue did I make?",
  "Which products are running out of stock?",
  "Why are my sales decreasing?",
  "What is my profit margin?"
];
for (const question of questions) {
  const results = await selectTools(question);

  console.log("\nQuestion:", question);

  for (const result of results) {
    console.log(`${result.tool}: ${result.similarity}`);
  }
}