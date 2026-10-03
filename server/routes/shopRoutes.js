import express from "express";
import multer from "multer";

import {
  analyzeShop
} from "../controllers/shopController.js";

import {
  uploadCsv
} from "../controllers/uploadController.js";


const router = express.Router();


const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const isCsv =
      file.mimetype === "text/csv" ||
      file.originalname
        .toLowerCase()
        .endsWith(".csv");


    if (!isCsv) {
      return cb(
        new Error("Only CSV files are allowed.")
      );
    }


    cb(null, true);
  }
});


router.post(
  "/analyze",
  analyzeShop
);


router.post(
  "/upload",
  upload.single("file"),
  uploadCsv
);


export default router;
