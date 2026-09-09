import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%",
  background: "var(--ink-raised)",
  border: "1px solid var(--ink-line)",
  borderRadius: "4px",
  padding: "12px 14px",
  color: "var(--paper)",
  fontSize: "14px",
  marginTop: "6px",
};

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await register(form.name, form.email, form.password);
    if (res.success) navigate("/dashboard");
    else setError(res.message);
  };

  return (
    <div className="shell" style={{ maxWidth: "420px", paddingTop: "88px" }}>
      <h1 style={{ fontSize: "32px" }}>Create your account</h1>
      <p style={{ color: "var(--paper-dim)", marginTop: "10px", fontSize: "14px" }}>
        Free — start analyzing links in under a minute.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "32px" }}>
        <label style={{ fontSize: "13px", color: "var(--paper-dim)" }}>
          Name
          <input
            type="text"
            required
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label style={{ fontSize: "13px", color: "var(--paper-dim)", display: "block", marginTop: "18px" }}>
          Email
          <input
            type="email"
            required
            style={inputStyle}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label style={{ fontSize: "13px", color: "var(--paper-dim)", display: "block", marginTop: "18px" }}>
          Password
          <input
            type="password"
            required
            minLength={6}
            style={inputStyle}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        {error && <p style={{ color: "var(--coral)", fontSize: "13px", marginTop: "14px" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "24px",
            background: "var(--teal)",
            color: "var(--ink)",
            border: "none",
            borderRadius: "4px",
            padding: "13px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: "22px", fontSize: "14px", color: "var(--paper-dim)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--teal)" }}>Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
