import { readCsvFile } from "../utils/csvParser.js";

import {
  profileDataset
} from "../agents/datasetProfiler.js";

import {
  understandDataset
} from "../agents/schemaUnderstanding.js";

import {
  setCurrentDataset
} from "../services/datasetService.js";


export const uploadCsv = async (
  req,
  res
) => {

  try {

    /*
     * ----------------------------------------
     * 1. CHECK FILE
     * ----------------------------------------
     */

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message:
          "Please upload a CSV file."

      });

    }


    /*
     * ----------------------------------------
     * 2. READ CSV
     * ----------------------------------------
     */

    const filePath =
      req.file.path;


    const data =
      readCsvFile(
        filePath
      );


    if (!data.length) {

      return res.status(400).json({

        success: false,

        message:
          "The uploaded CSV is empty."

      });

    }


    /*
     * ----------------------------------------
     * 3. PROFILE DATASET
     * ----------------------------------------
     *
     * No assumptions about the dataset.
     *
     * The profiler detects:
     * - rows
     * - columns
     * - numeric columns
     * - date columns
     * - categorical columns
     * - missing values
     * - statistics
     */

    const profile =
      profileDataset(
        data
      );


    /*
     * ----------------------------------------
     * 4. UNDERSTAND DATASET SEMANTICALLY
     * ----------------------------------------
     *
     * This layer determines the analytical
     * meaning of columns.
     *
     * Example:
     *
     * quantity
     * -> measure
     * -> count
     *
     * item_total
     * -> measure
     * -> monetary
     *
     * ship_state
     * -> dimension
     * -> geography
     *
     * order_date
     * -> time
     */

    const semanticSchema =
      await understandDataset(
        data,
        profile
      );


    /*
     * ----------------------------------------
     * 5. STORE CURRENT DATASET
     * ----------------------------------------
     *
     * The dataset service now keeps:
     *
     * - raw data
     * - profiler result
     * - semantic understanding
     *
     * The future query planner will use
     * semanticSchema to decide what analysis
     * is possible.
     */

    setCurrentDataset({

      filename:
        req.file.originalname,

      filePath,

      data,

      profile,

      semanticSchema

    });


    /*
     * ----------------------------------------
     * 6. RETURN DATASET INFORMATION
     * ----------------------------------------
     */

    return res.json({

      success: true,

      dataset: {

        filename:
          req.file.originalname,

        rows:
          profile.rows,

        columns:
          profile.columns,

        datasetType:
          profile.datasetType,

        columnsInfo:
          profile.columnsInfo,

        numericColumns:
          profile.numericColumns,

        dateColumns:
          profile.dateColumns,

        categoricalColumns:
          profile.categoricalColumns,

        semanticSchema,

        preview:
          data.slice(
            0,
            5
          )

      }

    });

  } catch (error) {

    console.error(
      "CSV upload error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to process CSV file."

    });

  }

};