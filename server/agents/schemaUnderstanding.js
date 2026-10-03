import { createEmbedding } from "../ai/embeddingClient.js";
import { cosineSimilarity } from "../utils/vectorUtils.js";

const ROLE_DESCRIPTIONS = {
  identifier:
    "A unique identifier for a row, transaction, order, record, customer, product, machine, employee, or other entity.",

  time:
    "A date, timestamp, month, year, period, or other value representing when an event or observation occurred.",

  measure:
    "A numeric measurement that can be aggregated, averaged, compared, ranked, or analyzed.",

  monetary:
    "A numeric value representing money, price, revenue, cost, expense, profit, fee, salary, or another financial amount.",

  count:
    "A numeric quantity representing units, items, occurrences, people, orders, visits, defects, or another count.",

  dimension:
    "A categorical attribute that can be grouped or segmented, such as location, department, product, category, channel, type, or region.",

  status:
    "A categorical state or outcome such as completed, cancelled, returned, pending, active, inactive, failed, or approved.",

  geography:
    "A location-related attribute such as country, state, city, region, postal area, latitude, longitude, or geographic zone.",

  text:
    "Free-form descriptive text, notes, comments, descriptions, names, or natural language content.",

  boolean:
    "A true/false or yes/no field representing a binary condition."
};

const ROLE_KEYWORDS = {
  identifier: [
    "id",
    "identifier",
    "code",
    "number",
    "no",
    "sku",
    "uuid",
    "key"
  ],

  time: [
    "date",
    "time",
    "timestamp",
    "month",
    "year",
    "day",
    "period"
  ],

  monetary: [
    "price",
    "amount",
    "revenue",
    "sales",
    "cost",
    "expense",
    "profit",
    "fee",
    "salary",
    "income",
    "value",
    "total"
  ],

  count: [
    "quantity",
    "qty",
    "count",
    "units",
    "number_of",
    "num",
    "volume"
  ],

  geography: [
    "city",
    "state",
    "country",
    "region",
    "location",
    "district",
    "area",
    "latitude",
    "longitude",
    "postal",
    "zip"
  ],

  status: [
    "status",
    "state",
    "condition",
    "stage",
    "result",
    "outcome"
  ],

  dimension: [
    "category",
    "type",
    "department",
    "product",
    "channel",
    "segment",
    "class",
    "group",
    "brand"
  ]
};

let roleEmbeddings = null;

const getRoleEmbeddings = async () => {
  if (roleEmbeddings) {
    return roleEmbeddings;
  }

  roleEmbeddings = {};

  for (const [role, description] of Object.entries(
    ROLE_DESCRIPTIONS
  )) {
    roleEmbeddings[role] =
      await createEmbedding(description);
  }

  return roleEmbeddings;
};

const normalizeColumnName = (name) => {
  return String(name)
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
};

const keywordScore = (columnName, role) => {
  const normalized =
    normalizeColumnName(columnName);

  const words =
    normalized.split(/\s+/);

  const keywords =
    ROLE_KEYWORDS[role] || [];

  let score = 0;

  for (const keyword of keywords) {
    const normalizedKeyword =
      keyword.replace(/[_-]+/g, " ");

    if (
      normalized === normalizedKeyword ||
      words.includes(normalizedKeyword) ||
      normalized.includes(normalizedKeyword)
    ) {
      score += 1;
    }
  }

  return score;
};

const inferFromValues = (
  columnInfo,
  rows
) => {
  const values =
    rows
      .map(
        (row) =>
          row[columnInfo.name]
      )
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      )
      .slice(0, 20);

  const lowerValues =
    values.map((value) =>
      String(value)
        .trim()
        .toLowerCase()
    );

  const booleanValues = new Set([
    "true",
    "false",
    "yes",
    "no"
  ]);

  if (
    lowerValues.length > 0 &&
    lowerValues.every((value) =>
      booleanValues.has(value)
    )
  ) {
    return ["boolean"];
  }

  const statusValues = new Set([
    "delivered",
    "returned",
    "return",
    "cancelled",
    "canceled",
    "pending",
    "completed",
    "failed",
    "active",
    "inactive",
    "approved",
    "rejected"
  ]);

  const statusMatches =
    lowerValues.filter((value) =>
      statusValues.has(value)
    ).length;

  if (
    lowerValues.length >= 3 &&
    statusMatches / lowerValues.length >= 0.6
  ) {
    return [
      "status",
      "dimension"
    ];
  }

  return [];
};

const getSemanticText = (
  columnInfo,
  rows
) => {
  const samples =
    rows
      .map(
        (row) =>
          row[columnInfo.name]
      )
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
      )
      .slice(0, 8)
      .map((value) =>
        String(value)
      )
      .join(", ");

  return [
    `Column name: ${columnInfo.name}`,
    `Detected type: ${columnInfo.type}`,
    `Sample values: ${samples}`,
    `Unique values: ${columnInfo.uniqueValues}`,
    `Missing percentage: ${columnInfo.missingPercentage}%`
  ].join("\n");
};

const unique = (items) => [
  ...new Set(items)
];

export const understandDataset = async (
  rows,
  profile
) => {
  if (
    !rows ||
    !rows.length ||
    !profile?.columnsInfo?.length
  ) {
    return {
      columns: [],
      capabilities: []
    };
  }

  const embeddings =
    await getRoleEmbeddings();

  const columns = [];

  for (
    const columnInfo of profile.columnsInfo
  ) {
    const semanticText =
      getSemanticText(
        columnInfo,
        rows
      );

    const columnEmbedding =
      await createEmbedding(
        semanticText
      );

    const roleScores =
      Object.entries(embeddings)
        .map(
          ([role, roleEmbedding]) => ({
            role,
            similarity:
              cosineSimilarity(
                columnEmbedding,
                roleEmbedding
              )
          })
        );

    roleScores.sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );

    const roles = [];

    // Value-based understanding
    roles.push(
      ...inferFromValues(
        columnInfo,
        rows
      )
    );

    // Structural understanding
    if (
      columnInfo.type === "date"
    ) {
      roles.push("time");
    }

    if (
      columnInfo.type === "numeric"
    ) {
      roles.push("measure");
    }

    if (
      columnInfo.type === "categorical"
    ) {
      roles.push("dimension");
    }

    if (
      columnInfo.type === "boolean"
    ) {
      roles.push("boolean");
    }

    // Semantic embedding understanding
    const topRole =
      roleScores[0];

    if (
      topRole &&
      topRole.similarity >= 0.45
    ) {
      roles.push(
        topRole.role
      );
    }

    // Lightweight header evidence
    for (
      const role of Object.keys(
        ROLE_KEYWORDS
      )
    ) {
      if (
        keywordScore(
          columnInfo.name,
          role
        ) > 0
      ) {
        roles.push(role);
      }
    }

    columns.push({
      name: columnInfo.name,

      type:
        columnInfo.type,

      roles:
        unique(roles),

      confidence:
        topRole
          ? Number(
              Math.max(
                0,
                Math.min(
                  1,
                  topRole.similarity
                )
              ).toFixed(3)
            )
          : 0,

      statistics:
        columnInfo.statistics || null,

      uniqueValues:
        columnInfo.uniqueValues,

      missingPercentage:
        columnInfo.missingPercentage,

      sampleValues:
        columnInfo.sampleValues
    });
  }

  const hasRole = (role) =>
    columns.some(
      (column) =>
        column.roles.includes(role)
    );

  const capabilities = [];

  if (
    hasRole("measure") ||
    hasRole("monetary") ||
    hasRole("count")
  ) {
    capabilities.push(
      "aggregation"
    );

    capabilities.push(
      "comparison"
    );

    capabilities.push(
      "ranking"
    );
  }

  if (
    columns.some(
      (column) =>
        column.roles.includes(
          "dimension"
        ) ||
        column.roles.includes(
          "geography"
        ) ||
        column.roles.includes(
          "status"
        )
    )
  ) {
    capabilities.push(
      "grouping"
    );

    capabilities.push(
      "filtering"
    );
  }

  if (hasRole("time")) {
    capabilities.push(
      "trend"
    );
  }

  if (hasRole("measure")) {
    capabilities.push(
      "statistics"
    );
  }

  if (
    hasRole("monetary") &&
    hasRole("count")
  ) {
    capabilities.push(
      "ratio"
    );
  }

  return {
    columns,
    capabilities:
      unique(capabilities)
  };
};