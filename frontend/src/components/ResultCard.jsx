import VerdictBadge from "./VerdictBadge";

const Section = ({ title, children }) => (
  <div style={{ marginTop: "28px" }}>
    <h3 style={{ fontSize: "13px", color: "var(--paper-dim)", fontWeight: 500, marginBottom: "12px" }}>
      {title}
    </h3>
    {children}
  </div>
);

const Row = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid var(--ink-line)",
      fontSize: "14px",
    }}
  >
    <span style={{ color: "var(--paper-dim)" }}>{label}</span>
    <span className="mono" style={{ textAlign: "right", maxWidth: "60%" }}>
      {value}
    </span>
  </div>
);

const ResultCard = ({ scan }) => {
  if (!scan) return null;
  const { verdict, riskScore, domain, heuristics, aiAnalysis, geolocation, popupBehavior, reputation } = scan;

  return (
    <div
      style={{
        background: "var(--ink-raised)",
        border: "1px solid var(--ink-line)",
        borderRadius: "8px",
        padding: "28px",
        marginTop: "24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ color: "var(--paper-dim)", fontSize: "13px", margin: 0 }}>Domain analyzed</p>
          <p className="mono" style={{ fontSize: "18px", marginTop: "4px" }}>{domain}</p>
        </div>
        <VerdictBadge verdict={verdict} score={riskScore} />
      </div>

      {heuristics?.flaggedReasons?.length > 0 && (
        <Section title="Why this verdict">
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.7 }}>
            {heuristics.flaggedReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </Section>
      )}

      {aiAnalysis?.summary && (
        <Section title={`AI analysis (${aiAnalysis.provider})`}>
          <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{aiAnalysis.summary}</p>
        </Section>
      )}

      <Section title="URL structure">
        <Row label="Uses raw IP address" value={heuristics?.usesIp ? "Yes" : "No"} />
        <Row label="HTTPS secured" value={heuristics?.hasHttps ? "Yes" : "No"} />
        <Row label="Shortened link" value={heuristics?.isShortenedUrl ? "Yes" : "No"} />
        <Row label="Punycode domain" value={heuristics?.punycode ? "Yes" : "No"} />
        <Row label="URL length" value={`${heuristics?.urlLength} chars`} />
        {typeof heuristics?.domainAgeDays === "number" && (
          <Row label="Domain age" value={`${heuristics.domainAgeDays} day(s)`} />
        )}
        {heuristics?.brandImpersonation?.length > 0 && (
          <Row label="Brand impersonation" value={heuristics.brandImpersonation.join(", ")} />
        )}
      </Section>

      {reputation && (reputation.checked?.safeBrowsing || reputation.checked?.virusTotal) && (
        <Section title="Threat-intel feeds">
          {reputation.checked?.safeBrowsing && (
            <Row
              label="Google Safe Browsing"
              value={reputation.safeBrowsingFlagged ? `Flagged (${reputation.safeBrowsingThreats.join(", ")})` : "Clean"}
            />
          )}
          {reputation.checked?.virusTotal && (
            <Row
              label="VirusTotal"
              value={`${reputation.virusTotalMaliciousCount} malicious / ${reputation.virusTotalSuspiciousCount} suspicious of ${reputation.virusTotalTotalEngines} engines`}
            />
          )}
        </Section>
      )}

      {geolocation?.ip && (
        <Section title="Hosting origin">
          <Row label="Resolved IP" value={geolocation.ip} />
          <Row
            label="Region"
            value={[geolocation.city, geolocation.region, geolocation.country]
              .filter(Boolean)
              .join(", ")}
          />
          <Row label="Network / ISP" value={geolocation.isp} />
          <Row label="Timezone" value={geolocation.timezone} />
        </Section>
      )}

      {popupBehavior && (
        <Section title="Live behavior sandbox">
          <Row label="Popups / new windows" value={popupBehavior.popupsDetected} />
          <Row label="Redirects observed" value={popupBehavior.redirectsDetected} />
          {popupBehavior.notes && (
            <p style={{ fontSize: "13px", color: "var(--paper-dim)", marginTop: "10px" }}>
              {popupBehavior.notes}
            </p>
          )}
        </Section>
      )}
    </div>
  );
};

export default ResultCard;
