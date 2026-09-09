import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const styles = {
  wrap: {
    borderBottom: "1px solid var(--ink-line)",
    background: "var(--ink)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 0",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "var(--paper)",
  },
  mark: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "var(--teal)",
    boxShadow: "0 0 0 3px var(--teal-dim)",
  },
  brandText: {
    fontFamily: "var(--font-display)",
    fontSize: "20px",
  },
  nav: { display: "flex", gap: "24px", alignItems: "center" },
  link: {
    textDecoration: "none",
    color: "var(--paper-dim)",
    fontSize: "14px",
  },
  activeLink: {
    textDecoration: "none",
    color: "var(--paper)",
    fontSize: "14px",
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--ink-line)",
    color: "var(--paper)",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "14px",
  },
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header style={styles.wrap}>
      <div className="shell" style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <span style={styles.mark} />
          <span style={styles.brandText}>PhishShield</span>
        </Link>
        <nav style={styles.nav}>
          <Link to="/" style={isActive("/") ? styles.activeLink : styles.link}>
            Home
          </Link>
          {user && (
            <>
              <Link
                to="/dashboard"
                style={isActive("/dashboard") ? styles.activeLink : styles.link}
              >
                Scan
              </Link>
              <Link
                to="/history"
                style={isActive("/history") ? styles.activeLink : styles.link}
              >
                History
              </Link>
            </>
          )}
          {user ? (
            <button
              style={styles.btn}
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Sign in
              </Link>
              <Link to="/register">
                <button style={{ ...styles.btn, borderColor: "var(--teal)" }}>
                  Get started
                </button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
