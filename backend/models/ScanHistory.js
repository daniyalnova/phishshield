import mongoose from "mongoose";

const scanHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalUrl: { type: String, required: true },
    finalUrl: { type: String }, // after following redirects
    domain: { type: String },
    verdict: {
      type: String,
      enum: ["safe", "suspicious", "phishing"],
      required: true,
    },
    riskScore: { type: Number, min: 0, max: 100, required: true },

    heuristics: {
      usesIp: Boolean,
      hasAtSymbol: Boolean,
      hasSuspiciousTld: Boolean,
      isShortenedUrl: Boolean,
      hasManySubdomains: Boolean,
      hasHyphenInDomain: Boolean,
      hasSuspiciousKeywords: Boolean,
      hasHttps: Boolean,
      domainAgeDays: Number,
      urlLength: Number,
      redirectCount: Number,
      punycode: Boolean,
      brandImpersonation: [String],
      flaggedReasons: [String],
    },

    aiAnalysis: {
      provider: String,
      summary: String,
      confidence: Number,
      rawVerdict: String,
    },

    reputation: {
      safeBrowsingFlagged: Boolean,
      safeBrowsingThreats: [String],
      virusTotalMaliciousCount: Number,
      virusTotalSuspiciousCount: Number,
      virusTotalTotalEngines: Number,
    },

    geolocation: {
      ip: String,
      country: String,
      countryCode: String,
      region: String,
      city: String,
      isp: String,
      org: String,
      lat: Number,
      lon: Number,
      timezone: String,
    },

    popupBehavior: {
      popupsDetected: { type: Number, default: 0 },
      redirectsDetected: { type: Number, default: 0 },
      notes: String,
    },
  },
  { timestamps: true }
);

scanHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ScanHistory", scanHistorySchema);
