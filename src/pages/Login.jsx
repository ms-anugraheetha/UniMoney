import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        style={{ ...f.input, paddingRight: 62 }}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button type="button" onClick={() => setShow((s) => !s)} style={f.eye}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [form, setForm]         = useState({ identifier: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.identifier.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({
        identifier: form.identifier.trim(),
        password:   form.password,
      });
      login(res.user, res.token, remember);
      onNavigate("dashboard");
    } catch (err) {
      setError(err.message || "Incorrect credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={f.page}>
      <div style={f.card}>
        <div style={f.brand}>UniMoney</div>
        <div style={f.sub}>Student finance management</div>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 28 }}>
          {error && <div style={f.alert}>{error}</div>}

          <div style={f.field}>
            <label style={f.label}>Email or username</label>
            <input style={f.input} type="text" value={form.identifier}
              onChange={set("identifier")} autoComplete="username" />
          </div>

          <div style={f.field}>
            <label style={f.label}>Password</label>
            <PasswordInput value={form.password} onChange={set("password")}
              autoComplete="current-password" />
          </div>

          <label style={f.check}>
            <input type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: "var(--primary)", marginRight: 8, flexShrink: 0 }} />
            Keep me signed in
          </label>

          <button style={f.btn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={f.footer}>
            No account?{" "}
            <button type="button" style={f.link} onClick={() => onNavigate("register")}>
              Create one
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const f = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: 24,
  },
  card: {
    background: "var(--card)",
    borderRadius: 14,
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-lg)",
    width: "100%",
    maxWidth: 380,
    padding: "36px 32px 32px",
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "-0.4px",
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    color: "var(--text-3)",
    textAlign: "center",
    marginTop: 4,
  },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-2)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "10px 13px",
    fontSize: 14,
    color: "var(--text)",
    background: "var(--card)",
    boxSizing: "border-box",
  },
  eye: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-3)",
    padding: "2px 4px",
  },
  check: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    color: "var(--text-3)",
    cursor: "pointer",
    userSelect: "none",
    marginBottom: 20,
  },
  btn: {
    width: "100%",
    background: "var(--btn)",
    color: "var(--btn-text)",
    border: "none",
    borderRadius: 8,
    padding: "11px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.1px",
  },
  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    color: "var(--text-3)",
  },
  link: {
    background: "none",
    border: "none",
    color: "var(--primary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  alert: {
    background: "var(--red-bg)",
    border: "1px solid var(--red-border)",
    borderRadius: 8,
    padding: "10px 13px",
    color: "var(--red)",
    fontSize: 13,
    marginBottom: 16,
  },
};