import { useState } from "react";

const URLScanForm = ({ onScan, loading }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter a URL to analyze");
      return;
    }
    setError("");
    onScan(url.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          gap: "10px",
          background: "var(--ink-raised)",
          border: "1px solid var(--ink-line)",
          borderRadius: "6px",
          padding: "6px",
        }}
      >
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="paste-a-suspicious-link.example/verify-account"
          className="mono"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            padding: "14px 12px",
            fontSize: "15px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--teal)",
            color: "var(--ink)",
            border: "none",
            borderRadius: "4px",
            padding: "0 24px",
            fontWeight: 600,
            fontSize: "14px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Scanning…" : "Analyze"}
        </button>
      </div>
      {error && (
        <p style={{ color: "var(--coral)", fontSize: "13px", marginTop: "8px" }}>{error}</p>
      )}
    </form>
  );
};

export default URLScanForm;
