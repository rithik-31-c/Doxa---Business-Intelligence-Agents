const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/€/g, "")
    .replace(/£/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isNaN(number)
    ? null
    : number;
};


const round = (
  value,
  decimals = 2
) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(
    value.toFixed(decimals)
  );
};


const cleanRows = (
  rows,
  column
) => {
  return rows.filter(
    (row) =>
      toNumber(row[column]) !== null
  );
};


const aggregateValues = (
  values,
  aggregation
) => {
  const numbers = values
    .map(toNumber)
    .filter(
      (value) =>
        value !== null
    );

  if (!numbers.length) {
    return 0;
  }

  switch (aggregation) {
    case "sum":
      return round(
        numbers.reduce(
          (total, value) =>
            total + value,
          0
        )
      );

    case "average":
    case "avg":
      return round(
        numbers.reduce(
          (total, value) =>
            total + value,
          0
        ) / numbers.length
      );

    case "min":
      return round(
        Math.min(...numbers)
      );

    case "max":
      return round(
        Math.max(...numbers)
      );

    case "count":
      return numbers.length;

    default:
      throw new Error(
        `Unsupported aggregation: ${aggregation}`
      );
  }
};


/*
 * ----------------------------------------
 * AGGREGATE
 * ----------------------------------------
 */

const aggregate = (
  rows,
  plan
) => {
  if (
    plan.aggregation ===
    "count"
  ) {
    return {
      aggregation: "count",
      value: rows.length
    };
  }

  const validRows =
    cleanRows(
      rows,
      plan.measure
    );

  const values =
    validRows.map(
      (row) =>
        row[plan.measure]
    );

  return {
    aggregation:
      plan.aggregation,

    measure:
      plan.measure,

    value:
      aggregateValues(
        values,
        plan.aggregation
      ),

    rowsAnalyzed:
      validRows.length
  };
};


/*
 * ----------------------------------------
 * GROUP + AGGREGATE
 * ----------------------------------------
 */

const groupAggregate = (
  rows,
  plan
) => {
  const groups = {};

  for (const row of rows) {
    const groupValue =
      row[plan.groupBy];

    if (
      groupValue === undefined ||
      groupValue === null ||
      String(groupValue).trim() === ""
    ) {
      continue;
    }

    const key =
      String(groupValue);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(row);
  }

  const results =
    Object.entries(groups)
      .map(
        ([group, groupRows]) => {
          let value;

          if (
            plan.aggregation ===
            "count"
          ) {
            value =
              groupRows.length;
          } else {
            value =
              aggregateValues(
                groupRows.map(
                  (row) =>
                    row[plan.measure]
                ),
                plan.aggregation
              );
          }

          return {
            group,
            value,
            rows:
              groupRows.length
          };
        }
      );

  if (
    plan.sort ===
    "descending"
  ) {
    results.sort(
      (a, b) =>
        b.value -
        a.value
    );
  }

  if (
    plan.sort ===
    "ascending"
  ) {
    results.sort(
      (a, b) =>
        a.value -
        b.value
    );
  }

  const limitedResults =
    plan.limit
      ? results.slice(
          0,
          Number(plan.limit)
        )
      : results;

  return {
    groupBy:
      plan.groupBy,

    measure:
      plan.measure || null,

    aggregation:
      plan.aggregation,

    results:
      limitedResults
  };
};


/*
 * ----------------------------------------
 * FILTER
 * ----------------------------------------
 */

const filterRows = (
  rows,
  plan
) => {
  if (!plan.column) {
    throw new Error(
      "Filter operation requires a column."
    );
  }

  const expected =
    String(
      plan.value ?? ""
    )
      .trim()
      .toLowerCase();

  const filtered =
    rows.filter(
      (row) =>
        String(
          row[plan.column] ?? ""
        )
          .trim()
          .toLowerCase() ===
        expected
    );

  return {
    column:
      plan.column,

    value:
      plan.value,

    matchingRows:
      filtered.length,

    totalRows:
      rows.length,

    rows:
      filtered
  };
};


/*
 * ----------------------------------------
 * SORT
 * ----------------------------------------
 */

const sortRows = (
  rows,
  plan
) => {
  if (!plan.column) {
    throw new Error(
      "Sort operation requires a column."
    );
  }

  const sorted =
    [...rows].sort(
      (a, b) => {
        const aNumber =
          toNumber(
            a[plan.column]
          );

        const bNumber =
          toNumber(
            b[plan.column]
          );

        if (
          aNumber !== null &&
          bNumber !== null
        ) {
          return plan.sort ===
            "ascending"
            ? aNumber - bNumber
            : bNumber - aNumber;
        }

        const aValue =
          String(
            a[plan.column] ?? ""
          );

        const bValue =
          String(
            b[plan.column] ?? ""
          );

        return plan.sort ===
          "ascending"
          ? aValue.localeCompare(
              bValue
            )
          : bValue.localeCompare(
              aValue
            );
      }
    );

  return {
    column:
      plan.column,

    sort:
      plan.sort,

    rows:
      plan.limit
        ? sorted.slice(
            0,
            Number(plan.limit)
          )
        : sorted
  };
};


/*
 * ----------------------------------------
 * RANK
 * ----------------------------------------
 */

const rank = (
  rows,
  plan
) => {
  if (!plan.measure) {
    throw new Error(
      "Rank operation requires a measure."
    );
  }

  const sorted =
    [...rows].sort(
      (a, b) => {
        const aValue =
          toNumber(
            a[plan.measure]
          ) ?? 0;

        const bValue =
          toNumber(
            b[plan.measure]
          ) ?? 0;

        return (
          bValue -
          aValue
        );
      }
    );

  const limit =
    Number(plan.limit) || 10;

  return {
    measure:
      plan.measure,

    ranking:
      sorted
        .slice(
          0,
          limit
        )
        .map(
          (row, index) => ({
            rank:
              index + 1,

            value:
              toNumber(
                row[plan.measure]
              ),

            row
          })
        )
  };
};


/*
 * ----------------------------------------
 * PERCENTAGE
 * ----------------------------------------
 */

const percentage = (
  rows,
  plan
) => {
  if (!plan.column) {
    throw new Error(
      "Percentage operation requires a column."
    );
  }

  const expected =
    String(
      plan.value ?? ""
    )
      .trim()
      .toLowerCase();

  const matchingRows =
    rows.filter(
      (row) =>
        String(
          row[plan.column] ?? ""
        )
          .trim()
          .toLowerCase() ===
        expected
    );

  const total =
    rows.length;

  const percentageValue =
    total > 0
      ? (
          matchingRows.length /
          total
        ) * 100
      : 0;

  return {
    column:
      plan.column,

    value:
      plan.value,

    matchingRows:
      matchingRows.length,

    totalRows:
      total,

    percentage:
      round(
        percentageValue
      )
  };
};


/*
 * ----------------------------------------
 * TREND
 * ----------------------------------------
 */

const trend = (
  rows,
  plan
) => {
  if (
    !plan.dateColumn ||
    !plan.measure
  ) {
    throw new Error(
      "Trend operation requires dateColumn and measure."
    );
  }

  const validRows =
    rows.filter(
      (row) => {
        const date =
          new Date(
            row[plan.dateColumn]
          );

        const value =
          toNumber(
            row[plan.measure]
          );

        return (
          !Number.isNaN(
            date.getTime()
          ) &&
          value !== null
        );
      }
    );

  validRows.sort(
    (a, b) =>
      new Date(
        a[plan.dateColumn]
      ) -
      new Date(
        b[plan.dateColumn]
      )
  );

  const grouped = {};

  for (
    const row of validRows
  ) {
    const date =
      new Date(
        row[plan.dateColumn]
      );

    const key =
      date
        .toISOString()
        .slice(0, 10);

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(row);
  }

  const results =
    Object.entries(grouped)
      .map(
        ([date, dateRows]) => ({
          date,

          value:
            aggregateValues(
              dateRows.map(
                (row) =>
                  row[plan.measure]
              ),
              plan.aggregation ||
                "sum"
            )
        })
      );

  return {
    dateColumn:
      plan.dateColumn,

    measure:
      plan.measure,

    aggregation:
      plan.aggregation ||
      "sum",

    results
  };
};


/*
 * ----------------------------------------
 * DISTRIBUTION
 * ----------------------------------------
 */

const distribution = (
  rows,
  plan
) => {
  if (!plan.column) {
    throw new Error(
      "Distribution operation requires a column."
    );
  }

  const counts = {};

  for (const row of rows) {
    const value =
      String(
        row[plan.column] ?? ""
      ).trim();

    if (!value) {
      continue;
    }

    counts[value] =
      (counts[value] || 0) + 1;
  }

  const results =
    Object.entries(counts)
      .map(
        ([value, count]) => ({
          value,
          count,

          percentage:
            round(
              (count /
                rows.length) *
                100
            )
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      );

  return {
    column:
      plan.column,

    results
  };
};


/*
 * ----------------------------------------
 * MAIN ANALYSIS EXECUTOR
 * ----------------------------------------
 */

export const executeAnalysis = (
  rows,
  plan
) => {
  if (
    !Array.isArray(rows)
  ) {
    throw new Error(
      "Dataset rows must be an array."
    );
  }

  if (
    !plan ||
    !plan.operation
  ) {
    throw new Error(
      "A valid analysis plan is required."
    );
  }

  switch (
    plan.operation
  ) {

    case "aggregate":
      return aggregate(
        rows,
        plan
      );

    case "group_aggregate":
      return groupAggregate(
        rows,
        plan
      );

    case "filter":
      return filterRows(
        rows,
        plan
      );

    case "sort":
      return sortRows(
        rows,
        plan
      );

    case "rank":
      return rank(
        rows,
        plan
      );

    case "percentage":
      return percentage(
        rows,
        plan
      );

    case "trend":
      return trend(
        rows,
        plan
      );

    case "distribution":
      return distribution(
        rows,
        plan
      );

    default:
      throw new Error(
        `Analysis operation "${plan.operation}" is not implemented yet.`
      );
  }
};