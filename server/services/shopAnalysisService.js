import {
  getCurrentDataset
} from "./datasetService.js";

import {
  planQuery
} from "../agents/queryPlanner.js";

import {
  executeAnalysis
} from "../analysis/analysisEngine.js";

import {
  askLlama
} from "../ai/llamaClient.js";


const buildExplanationPrompt = (
  question,
  dataset,
  plan,
  evidence
) => {

  return `
You are DOXA, a general-purpose
business data investigation assistant.

The user asked:

"${question}"

Dataset:

"${dataset.filename}"

Analysis plan:

${JSON.stringify(
  plan,
  null,
  2
)}

Evidence calculated by the deterministic
analysis engine:

${JSON.stringify(
  evidence,
  null,
  2
)}

IMPORTANT RULES:

1. Do NOT invent facts.

2. Do NOT calculate new numerical values.

3. Use the numerical values exactly
   as provided in the evidence.

4. Do not change the meaning of the
   calculated evidence.

5. Clearly distinguish between:
   - findings supported by data
   - possible hypotheses

6. Do not invent customer behavior,
   competitors, market conditions,
   pricing changes, or business causes.

7. If the data only shows a correlation
   or pattern, do not present it as
   a proven cause.

8. Keep the explanation concise and
   useful for a business user.

9. Recommendations must be directly
   related to the evidence.

Return ONLY valid JSON.

Use this structure:

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
    },
    {
      "cause": "...",
      "status": "hypothesis"
    }
  ],
  "impact": {
    "description": "..."
  },
  "recommendations": []
}
`;
};


export const analyzeShopData = async (
  shopData
) => {

  /*
   * ----------------------------------------
   * 1. GET CURRENT DATASET
   * ----------------------------------------
   */

  const currentDataset =
    getCurrentDataset();


  if (!currentDataset) {

    throw new Error(
      "No dataset has been uploaded yet."
    );

  }


  const question =
    shopData?.question ||
    "Give me an overall analysis of the dataset.";


  /*
   * ----------------------------------------
   * 2. GET SEMANTIC SCHEMA
   * ----------------------------------------
   */

  const semanticSchema =
    currentDataset.semanticSchema;


  if (
    !semanticSchema ||
    !semanticSchema.columns?.length
  ) {

    throw new Error(
      "Dataset semantic schema is not available."
    );

  }


  /*
   * ----------------------------------------
   * 3. CREATE QUERY PLAN
   * ----------------------------------------
   */

  const plan =
    await planQuery(
      question,
      semanticSchema
    );


  /*
   * ----------------------------------------
   * 4. EXECUTE PLAN
   * ----------------------------------------
   *
   * This is deterministic JavaScript.
   *
   * Llama does NOT calculate these values.
   */

  const evidence =
    executeAnalysis(
      currentDataset.data,
      plan
    );


  /*
   * ----------------------------------------
   * 5. ASK LLAMA TO EXPLAIN
   * ----------------------------------------
   */

  const prompt =
    buildExplanationPrompt(
      question,
      currentDataset,
      plan,
      evidence
    );


  const llamaResponse =
    await askLlama([
      {
        role: "user",
        content: prompt
      }
    ]);


  /*
   * ----------------------------------------
   * 6. RETURN COMPLETE INVESTIGATION
   * ----------------------------------------
   */

  return {

    question,

    dataset: {
      filename:
        currentDataset.filename,

      rows:
        currentDataset.profile.rows,

      columns:
        currentDataset.profile.columns,

      datasetType:
        currentDataset.profile.datasetType
    },

    semanticSchema,

    plan,

    evidence,

    analysis:
      llamaResponse

  };

};