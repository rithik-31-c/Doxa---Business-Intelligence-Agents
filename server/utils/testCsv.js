import { readCsvFile } from "./csvParser.js";

const sales = readCsvFile("data/sales.csv");

console.log("First sales record:");
console.log(sales[0]);

console.log("\nTotal records:");
console.log(sales.length);