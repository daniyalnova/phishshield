import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import ResultCard from "../components/ResultCard";

const ScanDetails = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/scan/${id}`);
        setScan(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="shell" style={{ paddingTop: "56px", paddingBottom: "96px", maxWidth: "680px" }}>
      <Link to="/history" style={{ color: "var(--paper-dim)", fontSize: "13px" }}>
        ← Back to history
      </Link>
      {loading && <p style={{ color: "var(--paper-dim)", marginTop: "20px" }}>Loading…</p>}
      {!loading && !scan && <p style={{ color: "var(--paper-dim)", marginTop: "20px" }}>Scan not found.</p>}
      {scan && <ResultCard scan={scan} />}
    </div>
  );
};

export default ScanDetails;
