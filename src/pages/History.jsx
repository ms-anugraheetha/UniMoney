import { useState, useEffect, useMemo } from "react";
import { expensesAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const fmt = (n) => `€${Number(n).toFixed(2)}`;

const CAT_COLOR = {
  "Food & Drinks": "#16A34A", "Transport": "#2563EB", "Housing": "#7C3AED",
  "Education": "#D97706", "Entertainment": "#DB2777", "Health": "#0891B2",
  "Shopping": "#DC2626", "Utilities": "#EA580C", "Other": "#6B7280",
};

const Sk = ({ w = "100%", h = 16, r = 6 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

function HistorySkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><Sk w={120} h={26} r={8} /><div style={{ marginTop: 6 }}><Sk w={220} h={12} /></div></div>
      <Sk h={42} r={8} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Sk h={42} r={8} /><Sk h={42} r={8} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Sk w={80} h={13} r={4} /><Sk w={100} h={13} r={4} />
      </div>
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between" }}>
          <div><Sk w={160} h={13} r={4} /><div style={{ marginTop: 6 }}><Sk w={100} h={11} r={4} /></div></div>
          <Sk w={60} h={13} r={4} />
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  useEffect(() => {
    expensesAPI.getAll()
      .then(r => setExpenses(r.expenses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return expenses
      .filter(e => {
        const matchSearch = !search.trim() || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
        const matchFrom   = !fromDate || e.transaction_date >= fromDate;
        const matchTo     = !toDate   || e.transaction_date <= toDate;
        return matchSearch && matchFrom && matchTo;
      })
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  }, [expenses, search, fromDate, toDate]);

  const total = useMemo(() => filtered.reduce((sum, e) => sum + Number(e.amount), 0), [filtered]);
  const hasFilter = search.trim() || fromDate || toDate;

  if (loading) return <HistorySkeleton />;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>

      <header>
        <h1 style={s.h1}>{t("history.title")}</h1>
        <p style={s.subtitle}>{t("history.subtitle")}</p>
      </header>

      {error && <div role="alert" style={s.alert}>{error}</div>}

      <div style={{ position: "relative" }}>
        <span style={s.searchIcon} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          style={{ ...s.input, paddingLeft: 36, width: "100%" }}
          type="search"
          placeholder={t("history.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label={t("history.searchPlaceholder")}
        />
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          {t("history.dateRange")}
        </legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label htmlFor="from-date" style={s.label}>{t("history.from")}</label>
            <input id="from-date" type="date" style={{ ...s.input, width: "100%" }} value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate || undefined} aria-label="Start date" />
          </div>
          <div>
            <label htmlFor="to-date" style={s.label}>{t("history.to")}</label>
            <input id="to-date" type="date" style={{ ...s.input, width: "100%" }} value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate || undefined} aria-label="End date" />
          </div>
        </div>
      </fieldset>

      {hasFilter && (
        <button style={s.clearBtn} onClick={() => { setSearch(""); setFromDate(""); setToDate(""); }} aria-label={t("history.clearFilters")}>
          {t("history.clearFilters")}
        </button>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} aria-live="polite" aria-atomic="true">
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-4)" }}>
          {filtered.length} {filtered.length === 1 ? t("history.result") : t("history.results")}
        </span>
        {filtered.length > 0 && (
          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--text)" }}>
            {t("history.total")}: {fmt(total)}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty} aria-live="polite">
          <div style={{ fontSize: "var(--fs-2xl)", marginBottom: 10 }} aria-hidden="true">🔍</div>
          <div style={{ fontWeight: 600, color: "var(--text-3)" }}>{t("history.noResults")}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-4)", marginTop: 4 }}>
            {hasFilter ? t("history.tryAdjusting") : t("history.addSome")}
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }} aria-label="Expense list">
          {filtered.map(exp => (
            <li key={exp.expense_id} style={s.expRow}>
              <div style={s.expLeft}>
                <span style={{ ...s.dot, background: CAT_COLOR[exp.category] || "#6B7280" }} aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div style={s.expTitle}>{exp.title}</div>
                  <div style={s.expMeta}>
                    {exp.category} · {new Date(exp.transaction_date + "T00:00:00").toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
              <span style={s.expAmt}>-{fmt(exp.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {fromDate && toDate && filtered.length > 0 && (
        <div style={s.statementBox} role="region" aria-label={t("history.statementSummary")}>
          <div style={{ fontWeight: 600, color: "var(--text-2)", fontSize: "var(--fs-sm)", marginBottom: 4 }}>{t("history.statementSummary")}</div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-3)" }}>
            {fromDate} to {toDate} — {filtered.length} {t("history.transactions")} — {t("history.total")}: <strong style={{ color: "var(--text)" }}>{fmt(total)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  h1:          { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle:    { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  alert:       { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: "var(--fs-sm)" },
  label:       { display: "block", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-3)", marginBottom: 5 },
  input:       { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 13px", fontSize: "var(--fs-sm)", color: "var(--text)", background: "var(--card)", boxSizing: "border-box" },
  searchIcon:  { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" },
  clearBtn:    { background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 14px", fontSize: "var(--fs-xs)", color: "var(--text-3)", cursor: "pointer", alignSelf: "flex-start", fontWeight: 500 },
  expRow:      { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow)" },
  expLeft:     { display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 },
  dot:         { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  expTitle:    { fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 },
  expMeta:     { fontSize: "var(--fs-2xs)", color: "var(--text-4)", marginTop: 3 },
  expAmt:      { fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", flexShrink: 0 },
  empty:       { textAlign: "center", padding: "48px 0" },
  statementBox:{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", borderLeft: "3px solid var(--primary)" },
};
