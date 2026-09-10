import express from "express";
import {
  getGlobalStats,
  getAllUsers,
  getAllScans,
  setUserRole,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getGlobalStats);
router.get("/users", getAllUsers);
router.get("/scans", getAllScans);
router.patch("/users/:id/role", setUserRole);

export default router;
