import { useState, useEffect } from "react";
import { expensesAPI } from "../services/api";

const CATEGORIES = [
  "Food & Drinks", "Transport", "Housing", "Education",
  "Entertainment", "Health", "Shopping", "Utilities", "Other",
];

const CATEGORY_KEYWORDS = {
  "Food & Drinks": ["coffee","cafe","restaurant","lunch","dinner","breakfast","pizza","burger",
    "groceries","grocery","supermarket","food","drink","drinks","snack","takeaway","meal","tea",
    "juice","bakery","sushi","kebab","mc","kfc","subway","lidl","aldi","tesco","rewe"],
  "Transport": ["bus","train","tram","uber","bolt","taxi","metro","subway","fuel","petrol",
    "gas","parking","ferry","flight","ticket","transport","ride","bike","scooter"],
  "Housing": ["rent","electricity","water","internet","wifi","gas","heating","flat",
    "apartment","room","maintenance","cleaning","repair","furniture","housing"],
  "Education": ["tuition","course","book","books","textbook","library","school","university",
    "college","lecture","exam","stationery","pen","pencil","notebook","education","study"],
  "Entertainment": ["netflix","spotify","cinema","movie","concert","game","games","steam",
    "play","event","party","club","bar","entertainment","show","theatre","museum"],
  "Health": ["pharmacy","medicine","doctor","dentist","hospital","gym","fitness","health",
    "vitamin","supplement","clinic","appointment","prescription","wellness"],
  "Shopping": ["clothes","clothing","shoes","bag","jacket","shirt","amazon","zara","h&m",
    "shopping","mall","store","online","order","delivery","package"],
  "Utilities": ["phone","mobile","sim","subscription","insurance","bank","fee","charge",
    "utilities","bill","service","software","app","license"],
};

function detectCategory(title) {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

function today() { return new Date().toISOString().split("T")[0]; }

// Defined at module scope to prevent React remounting on re-renders
function Field({ label, hint, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={f.label}>{label}</label>
        {hint && <span style={f.hint}>{hint}</span>}
      </div>
      {children}
      {error && <div style={f.fieldErr}>{error}</div>}
    </div>
  );
}

export default function AddExpense({ onNavigate, editExpense }) {
  const isEdit = !!editExpense;

  const [form, setForm] = useState({
    title:            isEdit ? (editExpense.title            || "") : "",
    amount:           isEdit ? (editExpense.amount           || "") : "",
    category:         isEdit ? (editExpense.category         || "Food & Drinks") : "Food & Drinks",
    transaction_date: isEdit ? (editExpense.transaction_date || today()) : today(),
    description:      isEdit ? (editExpense.description      || "") : "",
  });
  const [autoDetected, setAutoDetected] = useState(false);
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [apiError, setApiError]         = useState("");

  useEffect(() => {
    if (editExpense) {
      setForm({
        title:            editExpense.title            || "",
        amount:           editExpense.amount           || "",
        category:         editExpense.category         || "Food & Drinks",
        transaction_date: editExpense.transaction_date || today(),
        description:      editExpense.description      || "",
      });
      setAutoDetected(false);
    }
  }, [editExpense]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const detected = detectCategory(title);
    setForm((p) => ({
      ...p, title,
      ...(detected && !isEdit ? { category: detected } : {}),
    }));
    if (detected && !isEdit) setAutoDetected(true);
    else setAutoDetected(false);
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())                                       e.title  = "Title is required";
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = "Enter a valid amount";
    if (!form.transaction_date)                                   e.date   = "Date is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const body = {
        title:            form.title.trim(),
        amount:           parseFloat(form.amount),
        category:         form.category,
        transaction_date: form.transaction_date,
        description:      form.description.trim(),
      };
      if (isEdit) {
        await expensesAPI.update(editExpense.expense_id, body);
      } else {
        await expensesAPI.create(body);
      }
      onNavigate("dashboard");
    } catch (err) {
      setApiError(err.message || "Failed to save expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={f.page}>
      <div style={f.header}>
        <div>
          <h1 style={f.h1}>{isEdit ? "Edit Expense" : "Add Expense"}</h1>
          <p style={f.sub}>{isEdit ? "Update the details below" : "Record a new transaction"}</p>
        </div>
        <button style={f.backBtn} onClick={() => onNavigate("dashboard")}>
          Back to Dashboard
        </button>
      </div>

      <div style={f.card}>
        <form onSubmit={handleSubmit} noValidate>
          {apiError && <div style={f.alert}>{apiError}</div>}

          <Field label="Title" error={errors.title}>
            <input
              style={{ ...f.input, borderColor: errors.title ? "var(--red-border)" : "var(--border)" }}
              type="text" value={form.title} onChange={handleTitleChange}
              placeholder="e.g. Coffee, Groceries, Rent" autoFocus={!isEdit}
            />
          </Field>

          <div style={f.row}>
            <Field label="Amount (EUR)" error={errors.amount}>
              <input
                style={{ ...f.input, borderColor: errors.amount ? "var(--red-border)" : "var(--border)" }}
                type="number" min="0" step="0.01"
                value={form.amount} onChange={set("amount")} placeholder="0.00"
              />
            </Field>
            <Field label="Date" error={errors.date}>
              <input
                style={{ ...f.input, borderColor: errors.date ? "var(--red-border)" : "var(--border)" }}
                type="date" value={form.transaction_date} onChange={set("transaction_date")}
              />
            </Field>
          </div>

          <Field label="Category" hint={autoDetected ? "Auto-detected from title" : undefined}>
            <select
              style={{
                ...f.input,
                borderColor: autoDetected ? "var(--green-border)" : "var(--border)",
                background: autoDetected ? "var(--green-bg)" : "var(--card)",
              }}
              value={form.category}
              onChange={(e) => { set("category")(e); setAutoDetected(false); }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Note">
            <input
              style={{ ...f.input, borderColor: "var(--border)" }}
              type="text" value={form.description}
              onChange={set("description")} placeholder="Optional note"
            />
          </Field>

          <div style={f.btnRow}>
            <button style={f.cancelBtn} type="button" onClick={() => onNavigate("dashboard")}>
              Cancel
            </button>
            <button style={f.submitBtn} type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const f = {
  page: { maxWidth: 600 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  h1: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.3px" },
  sub: { fontSize: 13, color: "var(--text-3)", margin: 0 },
  backBtn: { background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-2)", cursor: "pointer", flexShrink: 0 },
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "28px 28px 24px", boxShadow: "var(--shadow)" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label: { fontSize: 13, fontWeight: 500, color: "var(--text-2)" },
  hint: { fontSize: 11, fontWeight: 500, color: "var(--green)", letterSpacing: "0.01em" },
  input: { width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 13px", fontSize: 14, color: "var(--text)", background: "var(--card)", boxSizing: "border-box", outline: "none", transition: "border-color 0.15s" },
  fieldErr: { fontSize: 12, color: "var(--red)", marginTop: 4 },
  btnRow: { display: "flex", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 500, color: "var(--text-2)", cursor: "pointer" },
  submitBtn: { flex: 2, background: "var(--btn)", color: "var(--btn-text)", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.1px" },
  alert: { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 13px", color: "var(--red)", fontSize: 13, marginBottom: 20 },
};