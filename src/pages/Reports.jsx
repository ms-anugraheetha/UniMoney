import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { analyticsAPI, budgetAPI } from "../services/api";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#0891B2", "#7C3AED", "#DC2626", "#6B7280"];
const fmt = (n) => `EUR ${Number(n || 0).toFixed(2)}`;

function exportCsv(rows) {
  const header = ["Date", "Title", "Category", "Amount"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [row.transaction_date, row.title, row.category, Number(row.amount).toFixed(2)]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "unimoney-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    Promise.all([analyticsAPI.get(), budgetAPI.get()])
      .then(([expRes, budgetRes]) => {
        setExpenses(expRes.expenses || []);
        setBudget(budgetRes.budget || null);
      })
      .catch((err) => setError(err.message || "Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return expenses.filter((expense) => {
      if (fromDate && expense.transaction_date < fromDate) return false;
      if (toDate && expense.transaction_date > toDate) return false;
      return true;
    });
  }, [expenses, fromDate, toDate]);

  const totalSpent = useMemo(
    () => filtered.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [filtered]
  );

  const categoryData = useMemo(() => {
    const bucket = {};
    filtered.forEach((expense) => {
      bucket[expense.category] = (bucket[expense.category] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(bucket)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const bucket = {};
    filtered.forEach((expense) => {
      const key = expense.transaction_date?.slice(0, 7) || "Unknown";
      bucket[key] = (bucket[key] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(bucket)
      .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered]);

  const averageExpense = filtered.length ? totalSpent / filtered.length : 0;
  const remaining = budget?.monthly_limit ? Number(budget.monthly_limit) - totalSpent : null;

  if (loading) {
    return <div style={{ fontSize: 14, color: "var(--text-3)" }}>Loading reports...</div>;
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      <header>
        <h1 style={s.h1}>Analytics & Reports</h1>
        <p style={s.subtitle}>View summaries, trends, and export your expense data.</p>
      </header>

      {error && <div style={s.alert}>{error}</div>}

      <section style={s.card}>
        <div style={s.filters}>
          <div>
            <label htmlFor="report-from" style={s.label}>From</label>
            <input id="report-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={s.input} />
          </div>
          <div>
            <label htmlFor="report-to" style={s.label}>To</label>
            <input id="report-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={s.input} />
          </div>
          <button style={s.secondaryBtn} onClick={() => { setFromDate(""); setToDate(""); }}>
            Clear range
          </button>
          <button style={s.primaryBtn} onClick={() => exportCsv(filtered)} disabled={!filtered.length}>
            Export CSV
          </button>
        </div>
      </section>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Transactions</div>
          <div style={s.statValue}>{filtered.length}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total spent</div>
          <div style={s.statValue}>{fmt(totalSpent)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Average expense</div>
          <div style={s.statValue}>{fmt(averageExpense)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Budget status</div>
          <div style={s.statValue}>{remaining === null ? "No budget" : fmt(remaining)}</div>
        </div>
      </div>

      <div style={s.grid}>
        <section style={s.card}>
          <h2 style={s.sectionTitle}>Monthly trend</h2>
          {monthlyData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => fmt(value)} />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={s.empty}>No expense data available for charts yet.</div>
          )}
        </section>

        <section style={s.card}>
          <h2 style={s.sectionTitle}>Category breakdown</h2>
          {categoryData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={92} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={s.empty}>No categories to display yet.</div>
          )}
        </section>
      </div>

      <section style={s.card}>
        <h2 style={s.sectionTitle}>Report summary</h2>
        <p style={s.summary}>
          This report covers {filtered.length} transactions{fromDate || toDate ? ` between ${fromDate || "the beginning"} and ${toDate || "today"}` : ""}.
          Total spending is {fmt(totalSpent)}, and the average transaction amount is {fmt(averageExpense)}.
          {budget?.monthly_limit ? ` Your current monthly budget is ${fmt(budget.monthly_limit)}.` : " No monthly budget has been set yet."}
        </p>
      </section>
    </div>
  );
}

const s = {
  h1: { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle: { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  alert: { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: "var(--fs-sm)" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", boxShadow: "var(--shadow)" },
  filters: { display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" },
  label: { display: "block", fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--text-4)", marginBottom: 6 },
  input: { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: "var(--fs-sm)", color: "var(--text)", background: "var(--card)" },
  primaryBtn: { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" },
  secondaryBtn: { background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", fontSize: "var(--fs-sm)", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  statCard: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", boxShadow: "var(--shadow)" },
  statLabel: { fontSize: "var(--fs-xs)", color: "var(--text-4)", fontWeight: 600, marginBottom: 8 },
  statValue: { fontSize: "var(--fs-xl)", color: "var(--text)", fontWeight: 700 },
  sectionTitle: { fontSize: "var(--fs-md)", color: "var(--text)", fontWeight: 600, marginBottom: 12 },
  empty: { fontSize: "var(--fs-sm)", color: "var(--text-4)", padding: "32px 0", textAlign: "center" },
  summary: { fontSize: "var(--fs-sm)", color: "var(--text-2)", lineHeight: 1.7, margin: 0 },
};
