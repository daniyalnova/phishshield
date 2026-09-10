import ScanHistory from "../models/ScanHistory.js";
import User from "../models/User.js";
import { analyzeUrl } from "../utils/urlAnalyzer.js";
import { geolocateDomain } from "../utils/geoLocator.js";
import { getAiVerdict } from "../utils/aiAnalyzer.js";
import { analyzeLiveBehavior } from "../utils/browserAnalyzer.js";
import { checkReputation } from "../utils/reputationChecker.js";
import { getDomainAgeDays } from "../utils/domainAge.js";

// @route POST /api/scan
// body: { url, popupBehavior?: { popupsDetected, redirectsDetected, notes } }
export const scanUrl = async (req, res) => {
  try {
    const { url, popupBehavior } = req.body;
    if (!url) {
      return res.status(400).json({ message: "A URL is required" });
    }

    // Normalize: prepend protocol if missing
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;

    const heuristicResult = analyzeUrl(normalizedUrl);
    if (heuristicResult.error) {
      return res.status(400).json({ message: heuristicResult.message });
    }

    const { domain, verdict, riskScore, heuristics } = heuristicResult;

    // Run geolocation + AI analysis + sandboxed live behavior + reputation
    // feeds + domain-age lookup all in parallel
    const [geo, aiResult, liveBehavior, reputation, domainAgeDays] = await Promise.all([
      geolocateDomain(domain),
      getAiVerdict({ url: normalizedUrl, domain, heuristics, riskScore }),
      analyzeLiveBehavior(normalizedUrl),
      checkReputation(normalizedUrl),
      getDomainAgeDays(domain),
    ]);

    heuristics.domainAgeDays = domainAgeDays ?? undefined;
    if (typeof domainAgeDays === "number" && domainAgeDays < 30) {
      heuristics.flaggedReasons.push(
        `Domain was registered only ${domainAgeDays} day(s) ago — very new domains are frequently used for phishing`
      );
    }

    // Merge server-observed behavior with any client-reported behavior
    const mergedPopupBehavior = {
      popupsDetected:
        (liveBehavior?.popupsDetected || 0) + (popupBehavior?.popupsDetected || 0),
      redirectsDetected:
        (liveBehavior?.redirectsDetected || 0) + (popupBehavior?.redirectsDetected || 0),
      notes: [liveBehavior?.notes, popupBehavior?.notes].filter(Boolean).join(" "),
    };

    // Blend AI verdict into final verdict/score if available (AI acts as a secondary signal)
    let finalVerdict = verdict;
    let finalScore = riskScore;

    if (aiResult && aiResult.rawVerdict) {
      const aiSeverity = { safe: 0, suspicious: 1, phishing: 2 };
      const heuristicSeverity = aiSeverity[verdict] ?? 0;
      const aiSev = aiSeverity[aiResult.rawVerdict] ?? heuristicSeverity;
      // Take the more cautious (higher severity) of the two
      const severityToVerdict = ["safe", "suspicious", "phishing"];
      finalVerdict = severityToVerdict[Math.max(heuristicSeverity, aiSev)];
      finalScore = Math.round((riskScore + (aiResult.confidence || riskScore)) / 2);
    }

    // A hit from a real threat-intel feed is a hard, high-confidence signal —
    // it overrides heuristic/AI leniency rather than just averaging in.
    if (reputation.safeBrowsingFlagged || reputation.virusTotalMaliciousCount > 0) {
      finalVerdict = "phishing";
      finalScore = Math.max(finalScore, 90);
    } else if (reputation.virusTotalSuspiciousCount > 2) {
      finalVerdict = finalVerdict === "safe" ? "suspicious" : finalVerdict;
      finalScore = Math.max(finalScore, 50);
    }
    if (typeof domainAgeDays === "number" && domainAgeDays < 30 && finalVerdict === "safe") {
      finalVerdict = "suspicious";
      finalScore = Math.max(finalScore, 35);
    }

    const scan = await ScanHistory.create({
      user: req.user._id,
      originalUrl: url,
      finalUrl: normalizedUrl,
      domain,
      verdict: finalVerdict,
      riskScore: finalScore,
      heuristics,
      aiAnalysis: aiResult || undefined,
      reputation,
      geolocation: geo?.ip ? geo : undefined,
      popupBehavior: mergedPopupBehavior,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { scanCount: 1 } });

    res.status(201).json(scan);
  } catch (err) {
    res.status(500).json({ message: "Scan failed", error: err.message });
  }
};

// @route GET /api/scan/history
export const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const scans = await ScanHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ScanHistory.countDocuments({ user: req.user._id });

    res.json({ scans, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};

// @route GET /api/scan/:id
export const getScanById = async (req, res) => {
  try {
    const scan = await ScanHistory.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ message: "Scan not found" });
    res.json(scan);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch scan", error: err.message });
  }
};

// @route DELETE /api/scan/:id
export const deleteScan = async (req, res) => {
  try {
    const scan = await ScanHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!scan) return res.status(404).json({ message: "Scan not found" });
    res.json({ message: "Scan deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete scan", error: err.message });
  }
};

// @route GET /api/scan/stats/summary
export const getStats = async (req, res) => {
  try {
    const scans = await ScanHistory.find({ user: req.user._id });
    const total = scans.length;
    const phishing = scans.filter((s) => s.verdict === "phishing").length;
    const suspicious = scans.filter((s) => s.verdict === "suspicious").length;
    const safe = scans.filter((s) => s.verdict === "safe").length;

    const countryCounts = {};
    scans.forEach((s) => {
      if (s.geolocation?.country) {
        countryCounts[s.geolocation.country] = (countryCounts[s.geolocation.country] || 0) + 1;
      }
    });

    res.json({ total, phishing, suspicious, safe, countryCounts });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute stats", error: err.message });
  }
};
