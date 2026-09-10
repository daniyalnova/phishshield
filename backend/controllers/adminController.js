import User from "../models/User.js";
import ScanHistory from "../models/ScanHistory.js";

// @route GET /api/admin/stats
// Aggregated verdict counts, top flagged domains, and country spread
// across ALL users — not just the logged-in admin's own scans.
export const getGlobalStats = async (req, res) => {
  try {
    const [userCount, scanCount, verdictBreakdown, topDomains, countrySpread] =
      await Promise.all([
        User.countDocuments(),
        ScanHistory.countDocuments(),
        ScanHistory.aggregate([
          { $group: { _id: "$verdict", count: { $sum: 1 } } },
        ]),
        ScanHistory.aggregate([
          { $match: { verdict: { $in: ["phishing", "suspicious"] } } },
          { $group: { _id: "$domain", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        ScanHistory.aggregate([
          { $match: { "geolocation.country": { $ne: null } } },
          { $group: { _id: "$geolocation.country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    const verdicts = { safe: 0, suspicious: 0, phishing: 0 };
    verdictBreakdown.forEach((v) => {
      if (v._id) verdicts[v._id] = v.count;
    });

    res.json({
      userCount,
      scanCount,
      verdicts,
      topFlaggedDomains: topDomains.map((d) => ({ domain: d._id, count: d.count })),
      countrySpread: countrySpread.map((c) => ({ country: c._id, count: c.count })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute global stats", error: err.message });
  }
};

// @route GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// @route GET /api/admin/scans
// All users' scans, most recent first, paginated.
export const getAllScans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;

    const scans = await ScanHistory.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ScanHistory.countDocuments();

    res.json({ scans, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch scans", error: err.message });
  }
};

// @route PATCH /api/admin/users/:id/role
// body: { role: "admin" | "user" }
export const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update role", error: err.message });
  }
};
