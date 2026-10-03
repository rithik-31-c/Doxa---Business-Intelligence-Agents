const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}-\d{2}-\d{4}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/
];


/*
 * --------------------------------------------
 * BASIC HELPERS
 * --------------------------------------------
 */

const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  );
};


const isNumeric = (value) => {
  if (isEmpty(value)) {
    return false;
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/€/g, "")
    .replace(/£/g, "")
    .trim();

  return (
    cleaned !== "" &&
    !Number.isNaN(Number(cleaned))
  );
};


const isDate = (value) => {

  if (isEmpty(value)) {
    return false;
  }

  const stringValue =
    String(value).trim();

  /*
   * First check common date formats.
   */

  if (
    DATE_PATTERNS.some(
      (pattern) =>
        pattern.test(stringValue)
    )
  ) {
    return true;
  }

  /*
   * Avoid treating random numbers as dates.
   */

  if (isNumeric(stringValue)) {
    return false;
  }

  const timestamp =
    Date.parse(stringValue);

  return !Number.isNaN(timestamp);
};


const getNumericValue = (value) => {

  if (isEmpty(value)) {
    return null;
  }

  const cleaned =
    String(value)
      .replace(/₹/g, "")
      .replace(/,/g, "")
      .replace(/\$/g, "")
      .replace(/€/g, "")
      .replace(/£/g, "")
      .trim();

  const number =
    Number(cleaned);

  return Number.isNaN(number)
    ? null
    : number;
};


/*
 * --------------------------------------------
 * COLUMN TYPE DETECTION
 * --------------------------------------------
 */

const detectColumnType = (values) => {

  const validValues =
    values.filter(
      (value) =>
        !isEmpty(value)
    );

  if (!validValues.length) {
    return "unknown";
  }


  const numericCount =
    validValues.filter(
      isNumeric
    ).length;


  const dateCount =
    validValues.filter(
      isDate
    ).length;


  const numericRatio =
    numericCount /
    validValues.length;


  const dateRatio =
    dateCount /
    validValues.length;


  /*
   * Date gets priority here.
   */

  if (dateRatio >= 0.8) {
    return "date";
  }


  if (numericRatio >= 0.8) {
    return "numeric";
  }


  /*
   * Check whether this is mostly
   * boolean data.
   */

  const booleanValues = [
    "true",
    "false",
    "yes",
    "no"
  ];


  const booleanCount =
    validValues.filter(
      (value) =>
        booleanValues.includes(
          String(value)
            .trim()
            .toLowerCase()
        )
    ).length;


  if (
    booleanCount /
      validValues.length >=
    0.8
  ) {
    return "boolean";
  }


  return "categorical";
};


/*
 * --------------------------------------------
 * NUMERIC STATISTICS
 * --------------------------------------------
 */

const getNumericStatistics = (
  values
) => {

  const numbers =
    values
      .map(getNumericValue)
      .filter(
        (value) =>
          value !== null
      );


  if (!numbers.length) {
    return null;
  }


  const sum =
    numbers.reduce(
      (total, value) =>
        total + value,
      0
    );


  const min =
    Math.min(...numbers);


  const max =
    Math.max(...numbers);


  const average =
    sum / numbers.length;


  return {

    min: Number(
      min.toFixed(2)
    ),

    max: Number(
      max.toFixed(2)
    ),

    average: Number(
      average.toFixed(2)
    ),

    sum: Number(
      sum.toFixed(2)
    )

  };
};


/*
 * --------------------------------------------
 * COLUMN PROFILING
 * --------------------------------------------
 */

const profileColumn = (
  column,
  rows
) => {

  const values =
    rows.map(
      (row) =>
        row[column]
    );


  const nonEmptyValues =
    values.filter(
      (value) =>
        !isEmpty(value)
    );


  const missingValues =
    values.length -
    nonEmptyValues.length;


  const type =
    detectColumnType(values);


  const uniqueValues =
    new Set(
      nonEmptyValues.map(
        (value) =>
          String(value)
      )
    ).size;


  const profile = {

    name: column,

    type,

    totalValues:
      values.length,

    missingValues,

    missingPercentage:
      values.length > 0
        ? Number(
            (
              (missingValues /
                values.length) *
              100
            ).toFixed(2)
          )
        : 0,

    uniqueValues,

    uniquePercentage:
      nonEmptyValues.length > 0
        ? Number(
            (
              (uniqueValues /
                nonEmptyValues.length) *
              100
            ).toFixed(2)
          )
        : 0,

    sampleValues:
      nonEmptyValues
        .slice(0, 5)

  };


  /*
   * Add numeric statistics
   * when appropriate.
   */

  if (type === "numeric") {

    profile.statistics =
      getNumericStatistics(
        values
      );

  }


  return profile;
};


/*
 * --------------------------------------------
 * DATASET PROFILER
 * --------------------------------------------
 */

export const profileDataset = (
  rows
) => {

  if (
    !rows ||
    !rows.length
  ) {

    return {

      rows: 0,

      columns: 0,

      columnsInfo: [],

      datasetType:
        "empty"

    };

  }


  const columns =
    Object.keys(
      rows[0]
    );


  const columnsInfo =
    columns.map(
      (column) =>
        profileColumn(
          column,
          rows
        )
    );


  /*
   * ------------------------------------------
   * DATASET LEVEL INFORMATION
   * ------------------------------------------
   */

  const numericColumns =
    columnsInfo
      .filter(
        (column) =>
          column.type ===
          "numeric"
      )
      .map(
        (column) =>
          column.name
      );


  const dateColumns =
    columnsInfo
      .filter(
        (column) =>
          column.type ===
          "date"
      )
      .map(
        (column) =>
          column.name
      );


  const categoricalColumns =
    columnsInfo
      .filter(
        (column) =>
          column.type ===
          "categorical"
      )
      .map(
        (column) =>
          column.name
      );


  /*
   * A generic description.
   *
   * Notice that we are NOT saying
   * "this is a sales dataset".
   */

  let datasetType =
    "tabular";


  if (
    dateColumns.length > 0 &&
    numericColumns.length > 0
  ) {

    datasetType =
      "time_aware_tabular";

  }


  return {

    rows:
      rows.length,

    columns:
      columns.length,

    datasetType,

    columnsInfo,

    numericColumns,

    dateColumns,

    categoricalColumns

  };

};