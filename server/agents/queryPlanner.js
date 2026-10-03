import { askLlama } from "../ai/llamaClient.js";


const SUPPORTED_OPERATIONS = [
  "aggregate",
  "filter",
  "group_aggregate",
  "sort",
  "rank",
  "compare",
  "calculate",
  "trend",
  "distribution",
  "correlation",
  "percentage"
];


const normalize = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};


const findColumn = (
  requestedColumn,
  semanticSchema
) => {

  if (!requestedColumn) {
    return null;
  }

  const columns =
    semanticSchema?.columns || [];


  // Exact match first
  const exact =
    columns.find(
      (column) =>
        normalize(column.name) ===
        normalize(requestedColumn)
    );


  if (exact) {
    return exact;
  }


  // Fallback partial match
  return (
    columns.find(
      (column) =>
        normalize(column.name).includes(
          normalize(requestedColumn)
        )
    ) || null
  );
};


const validateColumn = (
  columnName,
  semanticSchema
) => {

  const column =
    findColumn(
      columnName,
      semanticSchema
    );


  if (!column) {

    return {
      valid: false,

      column: null,

      reason:
        `Column "${columnName}" does not exist in the dataset.`
    };

  }


  return {
    valid: true,

    column
  };
};


const validatePlan = (
  plan,
  semanticSchema
) => {

  if (
    !plan ||
    typeof plan !== "object"
  ) {

    throw new Error(
      "Query planner returned an invalid plan."
    );

  }


  if (
    !SUPPORTED_OPERATIONS.includes(
      plan.operation
    )
  ) {

    throw new Error(
      `Unsupported analysis operation: ${plan.operation}`
    );

  }


  /*
   * ----------------------------------------
   * FIND ALL COLUMNS USED BY THE PLAN
   * ----------------------------------------
   */

  const columnsToValidate = [];


  if (plan.groupBy) {
    columnsToValidate.push(
      plan.groupBy
    );
  }


  if (plan.measure) {
    columnsToValidate.push(
      plan.measure
    );
  }


  if (plan.column) {
    columnsToValidate.push(
      plan.column
    );
  }


  if (plan.dateColumn) {
    columnsToValidate.push(
      plan.dateColumn
    );
  }


  if (plan.compareColumn) {
    columnsToValidate.push(
      plan.compareColumn
    );
  }


  /*
   * ----------------------------------------
   * VALIDATE EVERY COLUMN
   * ----------------------------------------
   */

  for (
    const columnName of columnsToValidate
  ) {

    const result =
      validateColumn(
        columnName,
        semanticSchema
      );


    if (!result.valid) {

      throw new Error(
        result.reason
      );

    }

  }


  return plan;
};


const buildPrompt = (
  question,
  semanticSchema
) => {

  return `
You are the query planner for DOXA,
a general-purpose tabular data investigation system.

Your job is ONLY to understand the user's question
and create a deterministic analysis plan.

Do NOT calculate any numbers.

Do NOT answer the user's question.

Do NOT invent columns.

The dataset semantic schema is:

${JSON.stringify(
  semanticSchema,
  null,
  2
)}

The user's question is:

"${question}"

Supported operations:

- aggregate
- filter
- group_aggregate
- sort
- rank
- compare
- calculate
- trend
- distribution
- correlation
- percentage

Use ONLY columns that exist in the semantic schema.

Choose the simplest operation that can answer
the user's question.

Examples:

Question:
"Which state generated the highest revenue?"

Plan:
{
  "operation": "group_aggregate",
  "groupBy": "ship_state",
  "measure": "item_total",
  "aggregation": "sum",
  "sort": "descending",
  "limit": 1
}

Question:
"Which department has the highest average marks?"

Plan:
{
  "operation": "group_aggregate",
  "groupBy": "department",
  "measure": "marks",
  "aggregation": "average",
  "sort": "descending",
  "limit": 1
}

Question:
"What is the average treatment cost?"

Plan:
{
  "operation": "aggregate",
  "measure": "treatment_cost",
  "aggregation": "average"
}

Question:
"Show me the trend in revenue over time."

Plan:
{
  "operation": "trend",
  "dateColumn": "date",
  "measure": "revenue",
  "aggregation": "sum"
}

Question:
"What percentage of orders were returned?"

Plan:
{
  "operation": "percentage",
  "column": "order_status",
  "value": "Returned"
}

Question:
"Which products have the highest quantity?"

Plan:
{
  "operation": "group_aggregate",
  "groupBy": "product",
  "measure": "quantity",
  "aggregation": "sum",
  "sort": "descending",
  "limit": 10
}

Return ONLY valid JSON.

Use this exact structure:

{
  "operation": "...",
  "groupBy": null,
  "measure": null,
  "aggregation": null,
  "column": null,
  "value": null,
  "dateColumn": null,
  "sort": null,
  "limit": null,
  "reason": "Short explanation of why this operation answers the question."
}
`;
};


export const planQuery = async (
  question,
  semanticSchema
) => {

  /*
   * ----------------------------------------
   * 1. VALIDATE QUESTION
   * ----------------------------------------
   */

  if (
    !question ||
    !String(question).trim()
  ) {

    throw new Error(
      "A question is required."
    );

  }


  /*
   * ----------------------------------------
   * 2. VALIDATE SEMANTIC SCHEMA
   * ----------------------------------------
   */

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
   * 3. BUILD LLM PROMPT
   * ----------------------------------------
   */

  const prompt =
    buildPrompt(
      question,
      semanticSchema
    );


  /*
   * ----------------------------------------
   * 4. ASK LLAMA FOR PLAN
   * ----------------------------------------
   */

  const response =
    await askLlama([
      {
        role: "user",

        content: prompt
      }
    ]);


  /*
   * ----------------------------------------
   * 5. PARSE JSON
   * ----------------------------------------
   */

  let plan;


  try {

    plan =
      JSON.parse(
        response
      );

  } catch (error) {

    console.error(
      "Invalid planner response:",
      response
    );

    throw new Error(
      "Query planner returned invalid JSON."
    );

  }


  /*
   * ----------------------------------------
   * 6. VALIDATE PLAN
   * ----------------------------------------
   *
   * This prevents Llama from inventing
   * columns that do not exist.
   */

  const validatedPlan =
    validatePlan(
      plan,
      semanticSchema
    );


  /*
   * ----------------------------------------
   * 7. RETURN PLAN
   * ----------------------------------------
   */

  return validatedPlan;
};