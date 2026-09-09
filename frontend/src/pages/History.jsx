import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import VerdictBadge from "../components/VerdictBadge";

const History = () => {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [historyRes, statsRes] = await Promise.all([
          api.get("/scan/history"),
          api.get("/scan/stats/summary"),
        ]);
        setScans(historyRes.data.scans);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const deleteScan = async (id) => {
    await api.delete(`/scan/${id}`);
    setScans((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div className="shell" style={{ paddingTop: "56px", paddingBottom: "96px" }}>
      <h1 style={{ fontSize: "34px" }}>Scan history</h1>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--ink-line)",
            marginTop: "28px",
          }}
        >
          {[
            ["Total scans", stats.total],
            ["Phishing", stats.phishing],
            ["Suspicious", stats.suspicious],
            ["Safe", stats.safe],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--ink-raised)", padding: "20px" }}>
              <p className="mono" style={{ fontSize: "26px", margin: 0 }}>{value}</p>
              <p style={{ color: "var(--paper-dim)", fontSize: "13px", marginTop: "6px" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "36px" }}>
        {loading && <p style={{ color: "var(--paper-dim)" }}>Loading…</p>}
        {!loading && scans.length === 0 && (
          <p style={{ color: "var(--paper-dim)" }}>No scans yet — analyze a link from the Scan tab.</p>
        )}

        {scans.map((scan) => (
          <div
            key={scan._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0",
              borderBottom: "1px solid var(--ink-line)",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: "220px" }}>
              <Link to={`/history/${scan._id}`} className="mono" style={{ fontSize: "14px", color: "var(--paper)" }}>
                {scan.domain}
              </Link>
              <p style={{ color: "var(--paper-dim)", fontSize: "12px", marginTop: "4px" }}>
                {new Date(scan.createdAt).toLocaleString()}
                {scan.geolocation?.country ? ` · ${scan.geolocation.country}` : ""}
              </p>
            </div>
            <VerdictBadge verdict={scan.verdict} score={scan.riskScore} />
            <button
              onClick={() => deleteScan(scan._id)}
              style={{
                background: "transparent",
                border: "1px solid var(--ink-line)",
                color: "var(--paper-dim)",
                borderRadius: "4px",
                padding: "6px 12px",
                fontSize: "12px",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
