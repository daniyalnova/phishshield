import express from "express";
import {
  scanUrl,
  getHistory,
  getScanById,
  deleteScan,
  getStats,
} from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", scanUrl);
router.get("/history", getHistory);
router.get("/stats/summary", getStats);
router.get("/:id", getScanById);
router.delete("/:id", deleteScan);

export default router;
