import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

// Defined outside component — prevents React remounting inputs on each keystroke (focus loss bug)
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={f.label}>{label}</label>
      {children}
      {error && <div style={f.fieldErr}>{error}</div>}
    </div>
  );
}

function PasswordInput({ value, onChange, autoComplete, hasError }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        style={{
          ...f.input,
          borderColor: hasError ? "var(--red-border)" : "var(--border)",
          paddingRight: 62,
        }}
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

export default function Register({ onNavigate }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "", email: "", username: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())  e.fullName = "Full name is required";
    if (!form.email.trim())     e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                 e.email = "Enter a valid email address";
    if (!form.username.trim())  e.username = "Username is required";
    else if (form.username.length < 3)
                                 e.username = "Must be at least 3 characters";
    if (!form.password)          e.password = "Password is required";
    else if (form.password.length < 8)
                                 e.password = "Must be at least 8 characters";
    if (!form.confirmPassword)   e.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
                                 e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const res = await authAPI.register({
        fullName: form.fullName.trim(),
        email:    form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
      });
      login(res.user, res.token);
      onNavigate("dashboard");
    } catch (err) {
      setErrors({ general: err.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={f.page}>
      <div style={f.card}>
        <div style={f.brand}>UniMoney</div>
        <div style={f.sub}>Create your account</div>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 24 }}>
          {errors.general && <div style={f.alert}>{errors.general}</div>}

          <Field label="Full name" error={errors.fullName}>
            <input
              style={{ ...f.input, borderColor: errors.fullName ? "var(--red-border)" : "var(--border)" }}
              type="text" value={form.fullName} onChange={set("fullName")} autoComplete="name"
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              style={{ ...f.input, borderColor: errors.email ? "var(--red-border)" : "var(--border)" }}
              type="email" value={form.email} onChange={set("email")} autoComplete="email"
            />
          </Field>

          <Field label="Username" error={errors.username}>
            <input
              style={{ ...f.input, borderColor: errors.username ? "var(--red-border)" : "var(--border)" }}
              type="text" value={form.username} onChange={set("username")} autoComplete="username"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <PasswordInput value={form.password} onChange={set("password")}
              autoComplete="new-password" hasError={!!errors.password} />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword}>
            <PasswordInput value={form.confirmPassword} onChange={set("confirmPassword")}
              autoComplete="new-password" hasError={!!errors.confirmPassword} />
          </Field>

          <button style={f.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>

          <div style={f.footer}>
            Already have an account?{" "}
            <button type="button" style={f.link} onClick={() => onNavigate("login")}>
              Sign in
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
    padding: "24px 16px",
  },
  card: {
    background: "var(--card)",
    borderRadius: 14,
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-lg)",
    width: "100%",
    maxWidth: 400,
    padding: "32px 32px 28px",
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
  fieldErr: { fontSize: 12, color: "var(--red)", marginTop: 4 },
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
    marginTop: 6,
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
    marginBottom: 14,
  },
};