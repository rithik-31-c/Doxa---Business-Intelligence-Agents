import fs from "fs";
import { parse } from "csv-parse/sync";

export const readCsvFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};