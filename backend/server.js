import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dns from "node:dns";

// Some Linux environments (Kali, WSL, various VMs/containers) have broken or
// missing IPv6 routing. Node's default resolver tries IPv6 first and, on
// these setups, hangs on that attempt instead of failing fast — which eats
// the whole request timeout before ever falling back to IPv4. This forces
// IPv4-first resolution for every outbound request in the app (Gemini,
// VirusTotal, Safe Browsing, RDAP, ip-api.com), fixing the symptom of a
// request timing out at exactly its configured timeout value even though
// the same URL responds instantly via curl.
dns.setDefaultResultOrder("ipv4first");

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiting to prevent abuse of the scan endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "PhishShield API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PhishShield API running on port ${PORT}`);
});
