import { analyzeShopData } from "../services/shopAnalysisService.js";

export const analyzeShop = async (req, res) => {
  try {
    const result = await analyzeShopData(req.body);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Shop analysis error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};