import express from "express";
import rateLimit from "express-rate-limit";
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

// Per-user scan limiter: scanning is the expensive route (AI call, headless
// browser, threat-intel lookups all fire per request), so it needs its own
// tighter, per-account cap rather than relying on the global per-IP limiter
// in server.js. Keyed by user id so one heavy user can't starve others
// sharing an IP (offices, NAT, mobile carriers).
const scanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    message: "Too many scans from this account. Please wait a few minutes and try again.",
  },
});

router.post("/", scanLimiter, scanUrl);
router.get("/history", getHistory);
router.get("/stats/summary", getStats);
router.get("/:id", getScanById);
router.delete("/:id", deleteScan);

export default router;
