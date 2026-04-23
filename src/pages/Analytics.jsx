import { useState, useEffect } from "react";
import { budgetAPI } from "../services/api";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={f.label}>{label}</label>
      {children}
      {error && <div style={f.fieldErr}>{error}</div>}
    </div>
  );
}

export default function BudgetManagement() {
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year:  new Date().getFullYear(),
    limit: "",
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess]   = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    budgetAPI.get()
      .then((res) => {
        if (res.budget) setForm((p) => ({ ...p, limit: res.budget.monthly_limit ?? "" }));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.month) e.month = "Month is required";
    if (!form.year || isNaN(+form.year) || +form.year < 2000) e.year = "Enter a valid year";
    if (!form.limit || isNaN(+form.limit) || +form.limit <= 0) e.limit = "Enter a valid budget amount";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(""); setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await budgetAPI.save({
        month:         parseInt(form.month),
        year:          parseInt(form.year),
        monthly_limit: parseFloat(form.limit),
      });
      setSuccess("Budget saved successfully.");
    } catch (err) {
      setApiError(err.message || "Failed to save budget.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
        <div>
          <div className="skeleton" style={{ width: 120, height: 28, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 200, height: 13, borderRadius: 6, marginTop: 8 }} />
        </div>
        <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div className="fade-up" style={f.page}>
      <div style={f.header}>
        <h1 style={f.h1}>Budget</h1>
        <p style={f.sub}>Set your monthly spending limit</p>
      </div>

      <div style={f.card}>
        <form onSubmit={handleSubmit} noValidate>
          {apiError && <div style={f.alertErr}>{apiError}</div>}
          {success  && <div style={f.alertOk}>{success}</div>}

          <div style={f.row}>
            <Field label="Month" error={errors.month}>
              <select
                style={{ ...f.input, borderColor: errors.month ? "var(--red-border)" : "var(--border)" }}
                value={form.month} onChange={set("month")}
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Year" error={errors.year}>
              <input
                style={{ ...f.input, borderColor: errors.year ? "var(--red-border)" : "var(--border)" }}
                type="number" min="2000" max="2100"
                value={form.year} onChange={set("year")} placeholder="2026"
              />
            </Field>
          </div>

          <Field label="Monthly Budget Limit (EUR)" error={errors.limit}>
            <input
              style={{ ...f.input, borderColor: errors.limit ? "var(--red-border)" : "var(--border)" }}
              type="number" min="0" step="0.01"
              value={form.limit} onChange={set("limit")} placeholder="e.g. 500.00"
            />
          </Field>

          <div style={f.infoBox}>
            <div style={f.infoTitle}>How budgets work</div>
            <div style={f.infoText}>
              Your budget limit applies to the selected month. The Dashboard will show your
              spending progress against this limit in real time.
            </div>
          </div>

          <button style={f.submitBtn} type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Budget"}
          </button>
        </form>
      </div>
    </div>
  );
}

const f = {
  page: { maxWidth: 520 },
  header: { marginBottom: 28 },
  h1: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.3px" },
  sub: { fontSize: 13, color: "var(--text-3)", margin: 0 },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 28px 24px", boxShadow: "var(--shadow)" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 6 },
  input: { width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 13px", fontSize: 14, color: "var(--text)", background: "var(--card)", boxSizing: "border-box", outline: "none" },
  fieldErr: { fontSize: 12, color: "var(--red)", marginTop: 4 },
  infoBox: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginBottom: 20, marginTop: 4 },
  infoTitle: { fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 },
  infoText: { fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 },
  submitBtn: { width: "100%", background: "var(--btn)", color: "var(--btn-text)", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.1px" },
  alertErr: { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 13px", color: "var(--red)", fontSize: 13, marginBottom: 20 },
  alertOk:  { background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 8, padding: "10px 13px", color: "var(--green)", fontSize: 13, marginBottom: 20 },
};