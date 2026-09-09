const VERDICT_STYLES = {
  safe: { bg: "var(--teal-dim)", fg: "var(--teal)", label: "Clear signal" },
  suspicious: { bg: "var(--amber-dim)", fg: "var(--amber)", label: "Uncertain signal" },
  phishing: { bg: "var(--coral-dim)", fg: "var(--coral)", label: "Phishing detected" },
};

const VerdictBadge = ({ verdict, score }) => {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.suspicious;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        background: style.bg,
        color: style.fg,
        padding: "8px 16px",
        borderRadius: "4px",
        fontSize: "14px",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.fg }} />
      {style.label}
      {typeof score === "number" && (
        <span className="mono" style={{ opacity: 0.75 }}>
          {score}/100
        </span>
      )}
    </div>
  );
};

export default VerdictBadge;
