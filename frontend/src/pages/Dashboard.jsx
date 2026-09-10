import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import URLScanForm from "../components/URLScanForm";
import ResultCard from "../components/ResultCard";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const prefilledUrl = searchParams.get("url") || "";
  const autoScanFired = useRef(false);

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async (url) => {
    setLoading(true);
    setError("");
    setScan(null);
    try {
      const { data } = await api.post("/scan", { url });
      setScan(data);
    } catch (err) {
      setError(err.response?.data?.message || "Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Arriving here via the bookmarklet or browser extension (?url=...) should
  // scan immediately, not just prefill the box — that's the whole point of
  // checking a link before you click it elsewhere.
  useEffect(() => {
    if (prefilledUrl && !autoScanFired.current) {
      autoScanFired.current = true;
      handleScan(prefilledUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledUrl]);

  return (
    <div className="shell" style={{ paddingTop: "56px", paddingBottom: "96px" }}>
      <p style={{ color: "var(--paper-dim)", fontSize: "14px" }}>Welcome back, {user?.name}</p>
      <h1 style={{ fontSize: "34px", marginTop: "8px" }}>Analyze a link</h1>

      <div style={{ marginTop: "28px", maxWidth: "680px" }}>
        <URLScanForm onScan={handleScan} loading={loading} initialUrl={prefilledUrl} />
      </div>

      {error && <p style={{ color: "var(--coral)", marginTop: "18px", fontSize: "14px" }}>{error}</p>}

      <div style={{ maxWidth: "680px" }}>
        {scan && <ResultCard scan={scan} />}
      </div>
    </div>
  );
};

export default Dashboard;
