import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { expensesAPI, budgetAPI } from "../services/api";

const CAT_COLOR = {
  "Food & Drinks": "#16A34A", "Transport": "#2563EB", "Housing": "#7C3AED",
  "Education": "#D97706", "Entertainment": "#DB2777", "Health": "#0891B2",
  "Shopping": "#DC2626", "Utilities": "#EA580C", "Other": "#6B7280",
};
const CATEGORIES = Object.keys(CAT_COLOR);
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const KW = {
  "Food & Drinks": ["coffee","cafe","lunch","dinner","breakfast","restaurant","food","pizza","burger","tea","snack","meal","takeaway","groceries","grocery","supermarket","drink","bakery","kebab","beer"],
  "Transport":     ["bus","train","taxi","uber","tram","metro","petrol","fuel","parking","ticket","bolt","lyft","bike","ferry","flight","scooter"],
  "Housing":       ["rent","electricity","water","internet","wifi","gas","heating","flat","apartment","room","maintenance","broadband","landlord"],
  "Education":     ["book","course","tuition","university","school","college","study","textbook","library","lecture","exam","stationery"],
  "Entertainment": ["movie","cinema","netflix","spotify","game","concert","theatre","museum","show","streaming","disney","hbo"],
  "Health":        ["doctor","pharmacy","medicine","gym","fitness","hospital","dentist","vitamin","clinic","wellness"],
  "Shopping":      ["clothes","shoes","amazon","shop","store","mall","fashion","jacket","bag","gift","zara"],
  "Utilities":     ["phone","mobile","subscription","bill","insurance","broadband","sim"],
};
function detectCat(title) {
  const low = title.toLowerCase();
  for (const [cat, kws] of Object.entries(KW))
    if (kws.some((k) => low.includes(k))) return cat;
  return "Other";
}

const TIP_COLOR = {
  Budgeting: "#3B82F6", Saving: "#10B981", "Student Life": "#8B5CF6",
  Food: "#F59E0B", Transport: "#06B6D4", Investing: "#EC4899", Mindset: "#6366F1",
};
const TIPS = [
  { cat: "Budgeting",    text: "Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings." },
  { cat: "Saving",       text: "Pay yourself first — move money to savings the moment you get paid." },
  { cat: "Student Life", text: "Your student card is worth more than you think. Always ask about discounts." },
  { cat: "Budgeting",    text: "Review your subscriptions every month. Unused ones silently drain accounts." },
  { cat: "Food",         text: "Meal prep on Sundays. Cooking in batches saves €60-80 a month." },
  { cat: "Saving",       text: "The 72-hour rule: add purchases to a list and revisit in 3 days." },
  { cat: "Investing",    text: "Even €10 a month invested builds a real habit. Start today." },
  { cat: "Student Life", text: "Split streaming subscriptions with flatmates to halve your costs." },
  { cat: "Food",         text: "Shop at closing time for reduced items — often 50-75% off." },
  { cat: "Budgeting",    text: "A 5-minute weekly budget check prevents end-of-month panic." },
  { cat: "Transport",    text: "An annual bus or tram pass is usually 30% cheaper than weekly top-ups." },
  { cat: "Saving",       text: "Every coffee you skip: transfer that €3-4 straight to savings." },
  { cat: "Student Life", text: "Use your university library before buying any textbook." },
  { cat: "Investing",    text: "€50/month at age 20 beats €200/month starting at age 30." },
  { cat: "Mindset",      text: "Financial stress is real. Budgeting reduces anxiety, not just debt." },
  { cat: "Student Life", text: "Sell textbooks and gear you no longer use on Vinted or Depop." },
  { cat: "Saving",       text: "Try a no-spend weekend once a month and redirect what you saved." },
  { cat: "Mindset",      text: "Small consistent habits outperform big sporadic ones every time." },
  { cat: "Investing",    text: "An emergency fund of 1-2 months protects all your other goals." },
  { cat: "Mindset",      text: "Every euro saved in your 20s is worth several euros saved in your 40s." },
];

const TIPS_LV = [
  { cat: "Budgeting",    text: "Ievēro 50/30/20 noteikumu: 50% vajadzībām, 30% vēlmēm, 20% uzkrājumiem." },
  { cat: "Saving",       text: "Pirmkārt samaksā sev — tūlīt pēc algas saņemšanas pārskaitī naudu uzkrājumos." },
  { cat: "Student Life", text: "Tavs studenta apliecība ir vairāk vērta, nekā domā. Vienmēr jautā par atlaidēm." },
  { cat: "Budgeting",    text: "Katru mēnesi pārskatiet savus abonementus. Nelietotie klusi nosūc naudu." },
  { cat: "Food",         text: "Sagatavojiet ēdienu svētdienās. Vārīšana vairākās porcijās ietaupa €60-80 mēnesī." },
  { cat: "Saving",       text: "72 stundu noteikums: pievieno pirkumus sarakstam un pārskatī pēc 3 dienām." },
  { cat: "Investing",    text: "Pat €10 mēnesī investēti veido labu ieradumu. Sāc jau šodien." },
  { cat: "Student Life", text: "Dalies straumēšanas abonementos ar istabas biedriem, lai samazinātu izmaksas uz pusi." },
  { cat: "Food",         text: "Iepērcies pirms veikala aizvēršanas – atlaistas preces bieži par 50-75%." },
  { cat: "Budgeting",    text: "5 minūšu nedēļas budžeta pārbaude novērš mēneša beigu paniku." },
  { cat: "Transport",    text: "Gada autobusa vai tramvaja biļete parasti ir par 30% lētāka nekā nedēļas papildinājumi." },
  { cat: "Saving",       text: "Katru izlaisto kafiju — pārskaiti tos €3-4 tieši uzkrājumos." },
  { cat: "Student Life", text: "Izmanto universitātes bibliotēku, pirms pērk mācību grāmatas." },
  { cat: "Investing",    text: "€50/mēnesī 20 gadu vecumā ir vairāk vērts nekā €200/mēnesī no 30 gadu vecuma." },
  { cat: "Mindset",      text: "Finansiālais stress ir reāls. Budžeta plānošana mazina trauksmi, ne tikai parādus." },
  { cat: "Student Life", text: "Pārdod mācību grāmatas un lietas, kuras vairs nelietoji, Vinted vai Depop." },
  { cat: "Saving",       text: "Izmēģini vienu nedēļas nogali mēnesī bez tēriņiem un pārskaitī ietaupīto." },
  { cat: "Mindset",      text: "Mazi konsekenti ieradumi katru reizi pārspēj lielus sporādiskus." },
  { cat: "Investing",    text: "Ārkārtas fonds 1-2 mēnešu izdevumiem aizsargā visus pārējos mērķus." },
  { cat: "Mindset",      text: "Katrs 20 gados ietaupīts eiro ir vairāku eiro vērts 40 gados." },
];

function dayIndex() {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000) % TIPS.length;
}

const fmt   = (n) => `€${Number(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];

const Sk = ({ w = "100%", h = 16, r = 6 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
);
function HomeSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div><Sk w={260} h={28} r={8} /><div style={{ marginTop: 8 }}><Sk w={200} h={13} /></div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
      </div>
      <div className="skeleton" style={{ height: 72, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 56, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 60, borderRadius: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="skeleton" style={{ height: 260, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 10 }} />
      </div>
    </div>
  );
}

function QuickAdd({ onAdded }) {
  const { t } = useLanguage();
  const [title, setTitle]       = useState("");
  const [amount, setAmount]     = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const onTitleChange = (e) => {
    const v = e.target.value;
    setTitle(v);
    if (v.trim()) setCategory(detectCat(v));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!title.trim())                             return setErr(t("home.titleRequired"));
    if (!amount || isNaN(+amount) || +amount <= 0) return setErr(t("home.validAmount"));
    setSaving(true);
    try {
      await expensesAPI.create({ title: title.trim(), amount: parseFloat(amount), category, transaction_date: today(), description: "" });
      setTitle(""); setAmount(""); setCategory("Food & Drinks");
      onAdded();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <section style={s.card} aria-label={t("home.quickAdd")}>
      <h2 style={s.sectionTitle}>{t("home.quickAdd")}</h2>
      <form onSubmit={submit} style={s.qaForm} noValidate>
        <input
          style={{ ...s.input, flex: 2, minWidth: 140 }}
          placeholder={t("home.expenseDesc")}
          value={title} onChange={onTitleChange}
          aria-label={t("home.expenseDesc")}
        />
        <div style={{ position: "relative", flex: 1, minWidth: 90, maxWidth: 130 }}>
          <span style={s.currencySymbol} aria-hidden="true">€</span>
          <input
            style={{ ...s.input, paddingLeft: 26, width: "100%" }}
            type="number" placeholder="0.00" min="0" step="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount in euros"
          />
        </div>
        <select
          style={{ ...s.input, flex: 1, minWidth: 120, maxWidth: 160 }}
          value={category} onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button style={s.addBtn} type="submit" disabled={saving} aria-label={t("home.add")}>
          {saving ? t("home.adding") : t("home.add")}
        </button>
      </form>
      {err && <div role="alert" style={{ fontSize: "var(--fs-xs)", color: "var(--red)", marginTop: 6 }}>{err}</div>}
    </section>
  );
}

function TipCard() {
  const { t, lang } = useLanguage();
  const [idx, setIdx] = useState(dayIndex);
  const tips  = lang === "lv" ? TIPS_LV : TIPS;
  const tip   = tips[idx % tips.length];
  const color = TIP_COLOR[tip.cat] || "#3B82F6";

  return (
    <div style={{ ...s.card, borderLeft: `3px solid ${color}`, display: "flex", alignItems: "flex-start", gap: 12 }} role="complementary" aria-label="Daily financial tip">
      <span style={{ fontSize: "var(--fs-lg)", color, flexShrink: 0, marginTop: 1 }} aria-hidden="true">💡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("home.tipOfDay")}
        </div>
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-2)", lineHeight: 1.65, margin: 0 }}>{tip.text}</p>
      </div>
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        <button onClick={() => setIdx(i => (i - 1 + tips.length) % tips.length)} style={s.tipBtn} aria-label="Previous tip">‹</button>
        <button onClick={() => setIdx(i => (i + 1) % tips.length)} style={s.tipBtn} aria-label="Next tip">›</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, warning }) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: warning ? "var(--red)" : "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: "var(--fs-xs)", color: warning ? "var(--red)" : "var(--text-4)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function getFrequentExpenses(expenses) {
  const grouped = {};
  expenses.forEach((expense) => {
    const key = expense.title?.trim().toLowerCase();
    if (!key) return;
    if (!grouped[key]) {
      grouped[key] = {
        title: expense.title,
        category: expense.category,
        amount: Number(expense.amount),
        count: 0,
      };
    }
    grouped[key].count += 1;
    grouped[key].amount = Number(expense.amount);
  });
  return Object.values(grouped)
    .filter((expense) => expense.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

export default function Home({ onNavigate }) {
  const { user } = useAuth();
  const { t }    = useLanguage();
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const [expenses, setExpenses] = useState([]);
  const [budget,   setBudget]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear());

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  const monthName = MONTHS[selectedMonth - 1];

  const load = (month = selectedMonth, year = selectedYear) => {
    setError("");
    Promise.all([expensesAPI.getAll(), budgetAPI.get({ month, year })])
      .then(([eR, bR]) => { setExpenses(eR.expenses || []); setBudget(bR.budget || null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    setLoading(true);
    load(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const thisMonth    = useMemo(() => expenses.filter(e => e.transaction_date?.startsWith(monthKey)), [expenses, monthKey]);
  const totalSpent   = useMemo(() => thisMonth.reduce((sum, e) => sum + Number(e.amount), 0), [thisMonth]);
  const monthlyLimit = budget?.monthly_limit ?? 0;
  const remaining    = monthlyLimit - totalSpent;
  const pct          = monthlyLimit > 0 ? Math.min(100, (totalSpent / monthlyLimit) * 100) : 0;

  const recent = useMemo(() =>
    thisMonth.slice().sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)).slice(0, 8),
    [thisMonth]
  );

  const categoryData = useMemo(() => {
    const m = {};
    thisMonth.forEach(e => { m[e.category] = (m[e.category] || 0) + Number(e.amount); });
    return Object.entries(m).map(([name, val]) => ({ name, val: +val.toFixed(2) })).sort((a, b) => b.val - a.val);
  }, [thisMonth]);
  const maxCat = categoryData[0]?.val || 1;
  const frequentExpenses = useMemo(() => getFrequentExpenses(expenses), [expenses]);
  const years = useMemo(() => {
    const expenseYears = expenses
      .map((expense) => Number(expense.transaction_date?.slice(0, 4)))
      .filter(Boolean);
    const budgetYear = Number(budget?.year);
    const unique = new Set([currentYear, selectedYear, ...expenseYears, ...(budgetYear ? [budgetYear] : [])]);
    return [...unique].sort((a, b) => b - a);
  }, [expenses, budget?.year, selectedYear, currentYear]);

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete "${exp.title}"?`)) return;
    setDeleting(exp.expense_id);
    try {
      await expensesAPI.remove(exp.expense_id);
      setExpenses(p => p.filter(e => e.expense_id !== exp.expense_id));
    } catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  };

  const handleRepeat = async (exp) => {
    try {
      await expensesAPI.create({
        title: exp.title,
        amount: Number(exp.amount),
        category: exp.category,
        transaction_date: today(),
        description: "",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <HomeSkeleton />;

  const firstName = user?.full_name?.split(" ")[0] || user?.username;

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>

      <header>
        <h1 style={s.h1}>{t("home.greeting", { name: firstName })}</h1>
        <p style={s.subtitle}>{t("home.subtitle", { month: monthName })}</p>
      </header>

      <section style={s.card} aria-label="Dashboard month selector">
        <div style={s.periodHeader}>
          <div>
            <div style={s.sectionTitle}>Viewing period</div>
            <div style={s.periodHint}>Switch month to review past budgets and spending.</div>
          </div>
          <div style={s.periodControls}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={s.input} aria-label="Select month">
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={s.input} aria-label="Select year">
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && <div role="alert" style={s.alert}>{error}</div>}

      <div style={s.statsGrid} role="region" aria-label="Spending summary">
        <StatCard label={t("home.spentThisMonth")} value={fmt(totalSpent)} />
        <StatCard label={t("home.remainingBudget")} value={monthlyLimit > 0 ? fmt(Math.max(0, remaining)) : "—"} sub={remaining < 0 && monthlyLimit > 0 ? t("home.overBudget") : undefined} warning={remaining < 0 && monthlyLimit > 0} />
        <StatCard label={t("home.transactions")} value={thisMonth.length} sub={t("home.thisMonth")} />
      </div>

      {monthlyLimit > 0 && (
        <section style={s.card} aria-label={t("home.budgetUsed")}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={s.sectionTitle}>{t("home.budgetUsed")}</span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-3)", fontWeight: 600 }} aria-live="polite">{pct.toFixed(0)}%</span>
          </div>
          <div style={s.barTrack} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct.toFixed(0)}% of budget used`}>
            <div style={{ ...s.barFill, width: `${pct}%`, background: pct > 90 ? "#DC2626" : pct > 70 ? "#D97706" : "#2563EB" }} />
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-4)", marginTop: 6 }}>
            {fmt(totalSpent)} of {fmt(monthlyLimit)}
          </div>
        </section>
      )}

      <TipCard />
      <QuickAdd onAdded={load} />

      {frequentExpenses.length > 0 && (
        <section style={s.card} aria-label="Frequent expenses">
          <div style={s.repeatHeader}>
            <h2 style={{ ...s.sectionTitle, marginBottom: 0 }}>Repeat frequent expense</h2>
            <span style={s.repeatHint}>Add a repeated expense in one click</span>
          </div>
          <div style={s.repeatRow}>
            {frequentExpenses.map((exp) => (
              <button
                key={`${exp.title}-${exp.category}`}
                type="button"
                style={s.repeatChip}
                onClick={() => handleRepeat(exp)}
                aria-label={`Repeat ${exp.title}`}
              >
                {exp.title} · {fmt(exp.amount)}
              </button>
            ))}
          </div>
        </section>
      )}

      <div style={s.bottomGrid}>
        <section style={s.card} aria-label={t("home.recentTransactions")}>
          <h2 style={s.sectionTitle}>{t("home.recentTransactions")}</h2>
          {recent.length === 0 ? (
            <div style={s.empty} aria-live="polite">
              <div style={{ fontSize: "var(--fs-2xl)", marginBottom: 8 }} aria-hidden="true">🧾</div>
              <div style={{ fontWeight: 600, color: "var(--text-3)", fontSize: "var(--fs-sm)" }}>{t("home.noTransactions")}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-4)", marginTop: 4 }}>{t("home.useQuickAdd")}</div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Recent expenses list">
              {recent.map(exp => (
                <li key={exp.expense_id} style={s.expRow}>
                  <div style={s.expLeft}>
                    <span style={{ ...s.dot, background: CAT_COLOR[exp.category] || "#6B7280" }} aria-hidden="true" />
                    <div style={{ minWidth: 0 }}>
                      <div style={s.expTitle}>{exp.title}</div>
                      <div style={s.expMeta}>{exp.category} · {exp.transaction_date}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={s.expAmt}>{fmt(exp.amount)}</span>
                    <button
                      type="button"
                      style={s.actionBtn}
                      onClick={() => onNavigate?.("add-expense", exp)}
                      aria-label={`Edit ${exp.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={s.actionBtn}
                      onClick={() => handleRepeat(exp)}
                      aria-label={`Repeat ${exp.title}`}
                    >
                      Repeat
                    </button>
                    <button style={s.delBtn} onClick={() => handleDelete(exp)} disabled={deleting === exp.expense_id} aria-label={`Delete ${exp.title}`}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={s.card} aria-label={t("home.byCategory")}>
          <h2 style={s.sectionTitle}>{t("home.byCategory")}</h2>
          {categoryData.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: "var(--fs-2xl)", marginBottom: 8 }} aria-hidden="true">📊</div>
              <div style={{ fontWeight: 600, color: "var(--text-3)", fontSize: "var(--fs-sm)" }}>{t("home.noData")}</div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Category breakdown">
              {categoryData.slice(0, 6).map(({ name, val }) => (
                <li key={name} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-2)", fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)", fontWeight: 600 }}>{fmt(val)}</span>
                  </div>
                  <div style={s.catTrack} role="progressbar" aria-valuenow={Math.round((val/maxCat)*100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${name}: ${fmt(val)}`}>
                    <div style={{ width: `${(val/maxCat)*100}%`, height: "100%", background: CAT_COLOR[name] || "#2563EB", borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

const s = {
  h1:          { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle:    { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  alert:       { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: "var(--fs-sm)" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  statCard:    { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", boxShadow: "var(--shadow)" },
  statLabel:   { fontSize: "var(--fs-xs)", color: "var(--text-4)", fontWeight: 500, marginBottom: 6 },
  statValue:   { fontSize: "var(--fs-4xl)", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 },
  card:        { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", boxShadow: "var(--shadow)" },
  sectionTitle:{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)", marginBottom: 12 },
  periodHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  periodHint:  { fontSize: "var(--fs-xs)", color: "var(--text-4)" },
  periodControls:{ display: "flex", gap: 10, flexWrap: "wrap" },
  barTrack:    { background: "var(--bg)", borderRadius: 6, height: 8, overflow: "hidden" },
  barFill:     { height: "100%", borderRadius: 6, transition: "width 0.6s ease" },
  catTrack:    { background: "var(--bg)", borderRadius: 4, height: 6, overflow: "hidden" },
  tipBtn:      { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 5, padding: "2px 8px", fontSize: "var(--fs-md)", color: "var(--text-3)", cursor: "pointer", fontWeight: 600, lineHeight: 1 },
  qaForm:      { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  input:       { border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontSize: "var(--fs-sm)", color: "var(--text)", background: "var(--bg)", boxSizing: "border-box" },
  currencySymbol: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "var(--fs-sm)", color: "var(--text-3)", pointerEvents: "none" },
  addBtn:      { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  repeatHeader:{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  repeatHint:  { fontSize: "var(--fs-xs)", color: "var(--text-4)" },
  repeatRow:   { display: "flex", gap: 8, flexWrap: "wrap" },
  repeatChip:  { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 999, padding: "7px 12px", fontSize: "var(--fs-xs)", color: "var(--text-2)", cursor: "pointer", fontWeight: 600 },
  bottomGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  expRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" },
  expLeft:     { display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 },
  dot:         { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  expTitle:    { fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 },
  expMeta:     { fontSize: "var(--fs-2xs)", color: "var(--text-4)", marginTop: 2 },
  expAmt:      { fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text)" },
  actionBtn:   { background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: "var(--fs-xs)", color: "var(--text-3)", padding: "4px 8px", lineHeight: 1.2 },
  delBtn:      { background: "none", border: "none", cursor: "pointer", fontSize: "var(--fs-lg)", color: "var(--text-4)", padding: "0 2px", lineHeight: 1 },
  empty:       { textAlign: "center", padding: "28px 0" },
};
