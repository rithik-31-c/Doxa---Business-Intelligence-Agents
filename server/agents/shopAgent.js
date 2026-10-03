import path from "path";
import { fileURLToPath } from "url";

import { readCsvFile } from "../utils/csvParser.js";
import { selectTools } from "./toolSelector.js";

import { analyzeSales } from "../tools/salesTool.js";
import { analyzeInventory } from "../tools/inventoryTool.js";
import { analyzeTrends } from "../tools/trendTool.js";
import { calculateBusinessMetrics } from "../tools/calculatorTool.js";

import { askLlama } from "../ai/llamaClient.js";

import {
  getCurrentDataset
} from "../services/datasetService.js";


const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


/*
 * Default demo datasets
 */

const salesPath = path.join(
  __dirname,
  "../data/sales.csv"
);

const inventoryPath = path.join(
  __dirname,
  "../data/inventory.csv"
);


/*
 * Check whether the uploaded dataset
 * contains the required fields.
 */

const hasFields = (
  schema,
  fields
) => {

  return fields.every(
    (field) => Boolean(schema[field])
  );

};


export const runShopAgent = async (
  shopData
) => {

  const question =
    shopData.question ||
    "Give me an overall analysis of my shop.";


  /*
   * ==========================================
   * 1. GET CURRENT DATASET
   * ==========================================
   */

  const currentDataset =
    getCurrentDataset();


  let salesData;
  let inventoryData;
  let schema = {};
  let datasetName = "Demo dataset";


  /*
   * ==========================================
   * 2. USE UPLOADED DATASET
   * ==========================================
   */

  if (currentDataset) {

    console.log(
      `Using uploaded dataset: ${currentDataset.filename}`
    );

    salesData =
      currentDataset.data || [];

    inventoryData =
      currentDataset.data || [];

    schema =
      currentDataset.schema || {};

    datasetName =
      currentDataset.filename;

  }

  /*
   * ==========================================
   * 3. FALLBACK TO DEMO DATA
   * ==========================================
   */

  else {

    console.log(
      "No uploaded dataset. Using demo data."
    );

    salesData =
      readCsvFile(salesPath);

    inventoryData =
      readCsvFile(inventoryPath);

  }


  /*
   * ==========================================
   * 4. SELECT TOOLS
   * ==========================================
   */

  const selectedTools =
    await selectTools(question);


  const evidence = {};


  /*
   * ==========================================
   * 5. EXECUTE TOOLS
   * ==========================================
   */

  for (const selected of selectedTools) {

    switch (selected.tool) {


      /*
       * --------------------------------------
       * SALES
       * --------------------------------------
       */

      case "sales":

        if (currentDataset) {

          if (
            hasFields(
              schema,
              [
                "product",
                "quantity",
                "revenue"
              ]
            )
          ) {

            evidence.sales =
              analyzeSales(salesData);

          } else {

            evidence.salesUnavailable = {
              reason:
                "Sales analysis requires product, quantity, and revenue columns."
            };

          }

        } else {

          evidence.sales =
            analyzeSales(salesData);

        }

        break;


      /*
       * --------------------------------------
       * INVENTORY
       * --------------------------------------
       */

      case "inventory":

        if (currentDataset) {

          if (
            hasFields(
              schema,
              [
                "product",
                "currentStock",
                "reorderLevel"
              ]
            )
          ) {

            evidence.inventory =
              analyzeInventory(
                inventoryData
              );

          } else {

            evidence.inventoryUnavailable = {
              reason:
                "Inventory analysis requires product, current stock, and reorder level columns."
            };

          }

        } else {

          evidence.inventory =
            analyzeInventory(
              inventoryData
            );

        }

        break;


      /*
       * --------------------------------------
       * TRENDS
       * --------------------------------------
       */

      case "trends":

        if (currentDataset) {

          if (
            hasFields(
              schema,
              [
                "date",
                "product",
                "quantity",
                "revenue"
              ]
            )
          ) {

            evidence.trends =
              analyzeTrends(
                salesData
              );

          } else {

            evidence.trendsUnavailable = {
              reason:
                "Trend analysis requires date, product, quantity, and revenue columns."
            };

          }

        } else {

          evidence.trends =
            analyzeTrends(
              salesData
            );

        }

        break;


      /*
       * --------------------------------------
       * CALCULATOR
       * --------------------------------------
       */

      case "calculator":

        /*
         * Explicit values sent by the frontend
         */

        if (
          shopData.totalSales !== undefined
        ) {

          evidence.calculator =
            calculateBusinessMetrics({

              revenue:
                shopData.totalSales,

              expenses:
                shopData.totalExpenses || 0

            });

        }


        /*
         * Uploaded dataset with
         * revenue + expenses
         */

        else if (
          currentDataset &&
          hasFields(
            schema,
            [
              "revenue",
              "expenses"
            ]
          )
        ) {

          const totalRevenue =
            salesData.reduce(
              (total, row) =>
                total +
                Number(row.revenue || 0),
              0
            );


          const totalExpenses =
            salesData.reduce(
              (total, row) =>
                total +
                Number(row.expenses || 0),
              0
            );


          evidence.calculator =
            calculateBusinessMetrics({

              revenue:
                totalRevenue,

              expenses:
                totalExpenses

            });

        }

        break;

    }

  }


  /*
   * ==========================================
   * 6. REMOVE EMPTY "UNAVAILABLE" RESULTS
   * ==========================================
   */

  const usableEvidence =
    Object.keys(evidence).filter(
      (key) =>
        !key.endsWith("Unavailable")
    );


  /*
   * ==========================================
   * 7. CHECK WHETHER ANYTHING CAN BE ANALYZED
   * ==========================================
   */

  if (
    usableEvidence.length === 0
  ) {

    return {

      question,

      selectedTools,

      dataset: {
        filename:
          datasetName,

        schema
      },

      evidence,

      analysis:
        JSON.stringify({

          question,

          findings: [
            {
              title:
                "Insufficient data",

              evidence:
                "The uploaded dataset does not contain enough recognized business columns to answer this question."
            }
          ],

          possibleCauses: [],

          impact: {
            revenueLoss: 0,

            description:
              "Business impact could not be calculated from the available data."
          },

          recommendations: [
            "Upload a CSV containing relevant columns such as date, product, quantity, revenue, or inventory information."
          ]

        })

    };

  }


  /*
   * ==========================================
   * 8. CALCULATE BUSINESS IMPACT
   * ==========================================
   */

  let businessImpact = null;


  if (
    evidence.trends &&
    evidence.trends.revenueDrop !== undefined
  ) {

    const revenueDrop =
      evidence.trends.revenueDrop;


    if (
      revenueDrop > 0
    ) {

      businessImpact = {

        revenueLoss:
          revenueDrop,

        description:
          `Revenue decreased by ₹${revenueDrop.toLocaleString(
            "en-IN"
          )}.`

      };

    } else {

      businessImpact = {

        revenueLoss: 0,

        description:
          "No revenue loss was detected from the analyzed period."

      };

    }

  }


  /*
   * ==========================================
   * 9. SEND EVIDENCE TO LLAMA
   * ==========================================
   */

  const prompt = `
You are DOXA, a business investigation assistant
for small shops.

The user asked:

"${question}"

Dataset:

"${datasetName}"

Detected dataset schema:

${JSON.stringify(
  schema,
  null,
  2
)}

Evidence calculated by deterministic
business analysis tools:

${JSON.stringify(
  evidence,
  null,
  2
)}

Business impact calculated by the backend:

${JSON.stringify(
  businessImpact,
  null,
  2
)}


IMPORTANT RULES:

1. Do NOT invent facts.

2. Do NOT calculate numbers yourself.

3. Use numerical values exactly as provided
   by the backend.

4. Do not change numerical values.

5. Use ₹ when referring to the provided
   Indian business revenue values.

6. Never replace ₹ with $.

7. Do not claim something is a fact unless
   the evidence supports it.

8. Possible explanations that are not directly
   proven by the dataset must be marked as
   "hypothesis".

9. Do not invent competitors, market conditions,
   customer behavior, pricing changes, or
   operating costs.

10. Keep findings concise and useful for a
    small business owner.

11. Recommendations should directly relate
    to the evidence.

12. If a tool was unavailable because the
    dataset lacked required columns, do not
    pretend that analysis was performed.


For possible causes use:

{
  "cause": "...",
  "status": "supported_by_data"
}

or:

{
  "cause": "...",
  "status": "hypothesis"
}


Return ONLY valid JSON.

Use this exact structure:

{
  "question": "...",
  "findings": [
    {
      "title": "...",
      "evidence": "..."
    }
  ],
  "possibleCauses": [
    {
      "cause": "...",
      "status": "supported_by_data"
    }
  ],
  "impact": {
    "revenueLoss": 0,
    "description": "..."
  },
  "recommendations": []
}
`;


  /*
   * ==========================================
   * 10. ASK LLAMA
   * ==========================================
   */

  const llamaResponse =
    await askLlama([
      {
        role: "user",
        content: prompt
      }
    ]);


  /*
   * ==========================================
   * 11. RETURN COMPLETE RESULT
   * ==========================================
   */

  return {

    question,

    selectedTools,

    dataset: {

      filename:
        datasetName,

      schema

    },

    evidence,

    businessImpact,

    analysis:
      llamaResponse

  };

};