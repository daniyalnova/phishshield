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

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(form.email, form.password);
    if (res.success) navigate("/dashboard");
    else setError(res.message);
  };

  return (
    <div className="shell" style={{ maxWidth: "420px", paddingTop: "88px" }}>
      <h1 style={{ fontSize: "32px" }}>Sign in</h1>
      <p style={{ color: "var(--paper-dim)", marginTop: "10px", fontSize: "14px" }}>
        Access your scan history and dashboard.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "32px" }}>
        <label style={{ fontSize: "13px", color: "var(--paper-dim)" }}>
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: "22px", fontSize: "14px", color: "var(--paper-dim)" }}>
        No account yet? <Link to="/register" style={{ color: "var(--teal)" }}>Create one</Link>
      </p>
    </div>
  );
};

export default Login;
