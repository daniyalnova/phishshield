import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const stat = (value, label) => (
  <div>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "34px", margin: 0 }}>{value}</p>
    <p style={{ color: "var(--paper-dim)", fontSize: "13px", marginTop: "4px" }}>{label}</p>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="shell" style={{ paddingTop: "72px", paddingBottom: "96px" }}>
      <div style={{ maxWidth: "620px" }}>
        <p className="mono" style={{ color: "var(--teal)", fontSize: "13px", marginBottom: "18px" }}>
          scanning since page load — link analysis, live
        </p>
        <h1 style={{ fontSize: "52px" }}>
          Know where a link actually leads before you click it.
        </h1>
        <p style={{ color: "var(--paper-dim)", fontSize: "17px", marginTop: "20px", lineHeight: 1.6 }}>
          PhishShield reads the structure of a URL, checks it against an AI model,
          traces the domain to its hosting region, and watches how the page behaves
          in an isolated sandbox — popups, redirects, and all — before you ever open it yourself.
        </p>
        <div style={{ marginTop: "32px", display: "flex", gap: "14px" }}>
          <Link to={user ? "/dashboard" : "/register"}>
            <button
              style={{
                background: "var(--teal)",
                color: "var(--ink)",
                border: "none",
                borderRadius: "4px",
                padding: "14px 26px",
                fontWeight: 600,
                fontSize: "15px",
              }}
            >
              {user ? "Scan a link" : "Create free account"}
            </button>
          </Link>
          {!user && (
            <Link to="/login">
              <button
                style={{
                  background: "transparent",
                  color: "var(--paper)",
                  border: "1px solid var(--ink-line)",
                  borderRadius: "4px",
                  padding: "14px 26px",
                  fontSize: "15px",
                }}
              >
                Sign in
              </button>
            </Link>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "88px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "24px",
          borderTop: "1px solid var(--ink-line)",
          paddingTop: "32px",
        }}
      >
        {stat("5", "signal checks per scan")}
        {stat("3", "AI model options")}
        {stat("<15s", "typical scan time")}
        {stat("0", "data sold, ever")}
      </div>

      <div style={{ marginTop: "96px" }}>
        <h2 style={{ fontSize: "26px", marginBottom: "32px" }}>What each scan checks</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--ink-line)" }}>
          {[
            ["URL structure", "IP-based hosts, punycode, typosquatting, brand impersonation, shortened links."],
            ["AI cross-check", "A language model reviews the flagged signals and gives an independent verdict."],
            ["Hosting origin", "Resolves the domain to an IP and locates the country, region, and ISP behind it."],
            ["Live sandbox", "Visits the page in an isolated browser to catch popups, dialogs, and redirect chains."],
          ].map(([title, body]) => (
            <div key={title} style={{ background: "var(--ink)", padding: "28px" }}>
              <h3 style={{ fontSize: "17px", marginBottom: "10px" }}>{title}</h3>
              <p style={{ color: "var(--paper-dim)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
