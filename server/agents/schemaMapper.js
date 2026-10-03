const aliases = {
  date: [
    "date",
    "transaction_date",
    "sale_date",
    "order_date",
    "selling_date"
  ],

  product: [
    "product",
    "item",
    "item_name",
    "product_name",
    "product_item",
    "name"
  ],

  quantity: [
    "quantity",
    "qty",
    "units",
    "units_sold",
    "sold",
    "quantity_sold"
  ],

  revenue: [
    "revenue",
    "sales",
    "total_sales",
    "amount",
    "sales_amount",
    "total_amount",
    "revenue_amount"
  ],

  unitPrice: [
    "unit_price",
    "unitprice",
    "price",
    "selling_price",
    "sale_price"
  ],

  currentStock: [
    "current_stock",
    "currentstock",
    "stock",
    "available_stock",
    "stock_available",
    "inventory"
  ],

  reorderLevel: [
    "reorder_level",
    "reorderlevel",
    "reorder",
    "minimum_stock",
    "min_stock",
    "reorder_point"
  ],

  unitCost: [
    "unit_cost",
    "unitcost",
    "cost",
    "purchase_price",
    "cost_price"
  ],

  expenses: [
    "expenses",
    "expense",
    "costs",
    "total_expenses",
    "total_expense"
  ]
};


/*
 * Convert a CSV header into a comparable format.
 *
 * Example:
 *
 * "Item Name"      -> "itemname"
 * "item_name"      -> "itemname"
 * "ITEM-NAME"      -> "itemname"
 */
const normalizeHeader = (header) => {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
};


/*
 * Build a normalized alias lookup.
 */
const buildAliasLookup = () => {
  const lookup = {};

  for (const [canonical, names] of Object.entries(aliases)) {
    for (const name of names) {
      lookup[normalizeHeader(name)] = canonical;
    }
  }

  return lookup;
};


/*
 * Detect which canonical business field
 * each CSV column represents.
 */
export const mapColumns = (columns) => {
  const aliasLookup = buildAliasLookup();

  const schema = {};
  const confidence = {};
  const unmappedColumns = [];

  for (const column of columns) {
    const normalizedColumn =
      normalizeHeader(column);

    const canonical =
      aliasLookup[normalizedColumn];

    if (canonical) {

      /*
       * Don't overwrite an already detected
       * canonical field.
       */
      if (!schema[canonical]) {
        schema[canonical] = column;
        confidence[canonical] = 1;
      } else {
        unmappedColumns.push(column);
      }

    } else {
      unmappedColumns.push(column);
    }
  }

  return {
    schema,
    confidence,
    unmappedColumns
  };
};


/*
 * Convert raw CSV rows into DOXA's
 * standard structure.
 *
 * Example:
 *
 * {
 *   Date: "2026-09-01",
 *   Item: "Rice",
 *   Units: "20",
 *   Amount: "1100"
 * }
 *
 * becomes:
 *
 * {
 *   date: "2026-09-01",
 *   product: "Rice",
 *   quantity: 20,
 *   revenue: 1100
 * }
 */
export const normalizeRows = (
  rows,
  schema
) => {

  return rows.map((row) => {

    const normalized = {};

    for (const [canonical, originalColumn] of Object.entries(schema)) {

      const value =
        row[originalColumn];

      switch (canonical) {

        case "quantity":
        case "revenue":
        case "unitPrice":
        case "currentStock":
        case "reorderLevel":
        case "unitCost":
        case "expenses":

          normalized[canonical] =
            value === undefined ||
            value === ""
              ? null
              : Number(value);

          break;

        default:

          normalized[canonical] =
            value;

          break;
      }
    }

    return normalized;
  });
};


/*
 * Main function used by the upload controller.
 */
export const analyzeDatasetSchema = (
  rows
) => {

  if (!rows || rows.length === 0) {
    return {
      schema: {},
      confidence: {},
      unmappedColumns: [],
      normalizedData: []
    };
  }

  const columns =
    Object.keys(rows[0]);

  const {
    schema,
    confidence,
    unmappedColumns
  } = mapColumns(columns);

  const normalizedData =
    normalizeRows(
      rows,
      schema
    );

  return {
    schema,
    confidence,
    unmappedColumns,
    normalizedData
  };
};