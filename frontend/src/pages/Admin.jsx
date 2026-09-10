import { useEffect, useState } from "react";
import api from "../services/api";

const Tile = ({ value, label, color }) => (
  <div style={{ background: "var(--ink-raised)", padding: "20px" }}>
    <p className="mono" style={{ fontSize: "26px", margin: 0, color: color || "var(--paper)" }}>
      {value}
    </p>
    <p style={{ color: "var(--paper-dim)", fontSize: "13px", marginTop: "6px" }}>{label}</p>
  </div>
);

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const { data } = await api.patch(`/admin/users/${user._id}/role`, { role: newRole });
    setUsers((prev) => prev.map((u) => (u._id === data._id ? data : u)));
  };

  if (loading) {
    return (
      <div className="shell" style={{ paddingTop: "56px" }}>
        <p style={{ color: "var(--paper-dim)" }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell" style={{ paddingTop: "56px" }}>
        <p style={{ color: "var(--coral)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="shell" style={{ paddingTop: "56px", paddingBottom: "96px" }}>
      <h1 style={{ fontSize: "34px" }}>Admin</h1>
      <p style={{ color: "var(--paper-dim)", fontSize: "14px", marginTop: "8px" }}>
        Aggregated across every account, not just yours.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1px",
          background: "var(--ink-line)",
          marginTop: "28px",
        }}
      >
        <Tile value={stats.userCount} label="Total users" />
        <Tile value={stats.scanCount} label="Total scans" />
        <Tile value={stats.verdicts.phishing} label="Phishing" color="var(--coral)" />
        <Tile value={stats.verdicts.suspicious} label="Suspicious" color="var(--amber)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "48px" }}>
        <div>
          <h3 style={{ fontSize: "17px", marginBottom: "16px" }}>Most-flagged domains</h3>
          {stats.topFlaggedDomains.length === 0 && (
            <p style={{ color: "var(--paper-dim)", fontSize: "13px" }}>Nothing flagged yet.</p>
          )}
          {stats.topFlaggedDomains.map((d) => (
            <div
              key={d.domain}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--ink-line)",
                fontSize: "13px",
              }}
            >
              <span className="mono">{d.domain}</span>
              <span style={{ color: "var(--paper-dim)" }}>{d.count} scans</span>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ fontSize: "17px", marginBottom: "16px" }}>Top hosting countries</h3>
          {stats.countrySpread.length === 0 && (
            <p style={{ color: "var(--paper-dim)", fontSize: "13px" }}>No geolocation data yet.</p>
          )}
          {stats.countrySpread.map((c) => (
            <div
              key={c.country}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid var(--ink-line)",
                fontSize: "13px",
              }}
            >
              <span>{c.country}</span>
              <span style={{ color: "var(--paper-dim)" }}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: "17px", margin: "48px 0 16px" }}>Users</h3>
      {users.map((u) => (
        <div
          key={u._id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: "1px solid var(--ink-line)",
            fontSize: "14px",
          }}
        >
          <div>
            <span>{u.name}</span>
            <span style={{ color: "var(--paper-dim)", marginLeft: "10px", fontSize: "12px" }}>
              {u.email}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: u.role === "admin" ? "var(--teal)" : "var(--paper-dim)",
              }}
            >
              {u.role}
            </span>
            <button
              onClick={() => toggleRole(u)}
              style={{
                background: "transparent",
                border: "1px solid var(--ink-line)",
                color: "var(--paper-dim)",
                borderRadius: "4px",
                padding: "5px 10px",
                fontSize: "12px",
              }}
            >
              {u.role === "admin" ? "Revoke admin" : "Make admin"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
