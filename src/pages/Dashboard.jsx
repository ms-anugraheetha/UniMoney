import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { expensesAPI, budgetAPI } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CAT_COLOR = {
  "Food & Drinks": "#16A34A",
  "Transport":     "#2563EB",
  "Housing":       "#7C3AED",
  "Education":     "#D97706",
  "Entertainment": "#DB2777",
  "Health":        "#0891B2",
  "Shopping":      "#DC2626",
  "Utilities":     "#EA580C",
  "Other":         "#6B7280",
};

const CATEGORIES = Object.keys(CAT_COLOR);

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
  for (const [cat, kws] of Object.entries(KW)) {
    if (kws.some((k) => low.includes(k))) return cat;
  }
  return "Other";
}

const fmt   = (n) => `€${Number(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function calcStreak(expenses) {
  if (!expenses.length) return 0;
  const days = new Set(expenses.map((e) => e.transaction_date?.slice(0, 10)));
  let streak = 0;
  const cur = new Date();
  while (days.has(cur.toISOString().split("T")[0])) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function getFrequent(expenses) {
  const m = {};
  expenses.forEach((e) => {
    const k = e.title.toLowerCase();
    if (!m[k]) m[k] = { title: e.title, category: e.category, amount: e.amount, n: 0 };
    m[k].n++;
    m[k].amount = e.amount;
  });
  return Object.values(m).sort((a, b) => b.n - a.n).slice(0, 3);
}

// ── Financial tips ─────
const TIP_COLOR = {
  Budgeting:     "#3B82F6",
  Saving:        "#10B981",
  "Student Life":"#8B5CF6",
  Food:          "#F59E0B",
  Transport:     "#06B6D4",
  Investing:     "#EC4899",
  Mindset:       "#6366F1",
};

const TIP_ICON = {
  Budgeting:     "◈",
  Saving:        "◎",
  "Student Life":"◉",
  Food:          "◆",
  Transport:     "▶",
  Investing:     "▲",
  Mindset:       "★",
};

const TIPS = [
  { cat: "Budgeting",     text: "Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. Even a rough split is better than none." },
  { cat: "Saving",        text: "Pay yourself first - move money to savings the moment you get paid, before you get a chance to spend it." },
  { cat: "Student Life",  text: "Your student card is worth more than you think. Always ask about discounts - most go completely unclaimed." },
  { cat: "Budgeting",     text: "Review your subscriptions every month. Unused ones are silent budget killers that drain accounts invisibly." },
  { cat: "Food",          text: "Meal prep on Sundays. Cooking in batches saves €60-80 a month and means fewer expensive last-minute takeaways." },
  { cat: "Saving",        text: "The 72-hour rule: want to buy something? Add it to a list and revisit it in 3 days. Most impulse urges disappear." },
  { cat: "Investing",     text: "The best time to start investing was yesterday. The second best is today - even €10 a month builds a real habit." },
  { cat: "Student Life",  text: "Split streaming subscriptions with flatmates. Sharing Netflix, Spotify and similar services can halve your costs." },
  { cat: "Food",          text: "Shop at closing time for reduced items. Supermarkets discount food near its use-by date - often 50-75% off." },
  { cat: "Budgeting",     text: "Track every purchase for 30 days. Awareness alone reduces spending by around 15% for most people." },
  { cat: "Transport",     text: "An annual bus or tram pass is usually 30% cheaper than weekly top-ups if you commute regularly." },
  { cat: "Saving",        text: "Every time you skip buying a coffee out, transfer that €3-4 straight to savings. Small habits compound fast." },
  { cat: "Student Life",  text: "Use your university library before buying any textbook. Most are available free - and older editions work fine." },
  { cat: "Investing",     text: "Compound interest is time's superpower. €50/month at 20 beats €200/month starting at 30 over a lifetime." },
  { cat: "Food",          text: "Frozen vegetables are just as nutritious as fresh and cost a fraction of the price. Stock your freezer." },
  { cat: "Mindset",       text: "Financial stress is real. Budgeting reduces anxiety, not just debt. Knowing your numbers gives you control." },
  { cat: "Student Life",  text: "Sell textbooks, clothes, and gear you no longer use. Facebook Marketplace, Vinted, and Depop are easy money." },
  { cat: "Budgeting",     text: "A 5-minute weekly budget check prevents end-of-month panic. Set a Sunday reminder and stick to it." },
  { cat: "Saving",        text: "Try a no-spend weekend once a month. Plan free activities and redirect whatever you would have spent." },
  { cat: "Mindset",       text: "Small consistent habits outperform big sporadic actions. €5 saved daily beats €150 saved once a month." },
  { cat: "Transport",     text: "Walk or cycle short distances instead of taking transport. Saves money, keeps you fit, and clears your head." },
  { cat: "Student Life",  text: "Apply for every grant, bursary, and scholarship you can find. Most are never fully subscribed - money left unclaimed." },
  { cat: "Investing",     text: "Avoid lifestyle inflation. When your income grows, increase savings before increasing spending." },
  { cat: "Food",          text: "Plan meals around what is on sale, not the other way around. Let the deals decide the weekly menu." },
  { cat: "Mindset",       text: "Comparison is the thief of financial progress. Focus on your own goals and journey, not others'." },
  { cat: "Saving",        text: "Open a high-interest savings account and let your money work while it sits. Even 3-4% adds up yearly." },
  { cat: "Budgeting",     text: "Set weekly micro-budgets for eating out and entertainment. Knowing your limit makes spending guilt-free." },
  { cat: "Student Life",  text: "Cycle or walk to uni when possible. Combined with a packed lunch, this alone can save €150+ a month." },
  { cat: "Investing",     text: "An emergency fund of 1-2 months' expenses protects all your other financial goals when life surprises you." },
  { cat: "Mindset",       text: "Every euro you save in your 20s is worth several euros saved in your 40s. Time in the market beats timing it." },
];

function dayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return day % TIPS.length;
}

// ── Tip card (outside Dashboard to prevent remount) ──────
function TipCard() {
  const [idx, setIdx] = useState(dayIndex);
  const tip   = TIPS[idx];
  const color = TIP_COLOR[tip.cat] || "#6B7280";
  const icon  = TIP_ICON[tip.cat]  || "◈";

  const next = () => setIdx((i) => (i + 1) % TIPS.length);
  const prev = () => setIdx((i) => (i - 1 + TIPS.length) % TIPS.length);

  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${color}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ fontSize: 20, color, flexShrink: 0, marginTop: 1, width: 24, textAlign: "center" }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <span style={{ background: `${color}20`, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {tip.cat}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 500 }}>Daily tip</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{tip.text}</p>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 1 }}>
        <button onClick={prev} style={S.tipBtn} title="Previous tip">‹</button>
        <button onClick={next} style={S.tipBtn} title="Next tip">›</button>
      </div>
    </div>
  );
}

// ── Skeleton helpers ─────
const Sk = ({ w = "100%", h = 16, r = 6 }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
);

function DashSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Sk w={240} h={28} r={8} />
          <div style={{ marginTop: 8 }}><Sk w={180} h={13} /></div>
        </div>
        <Sk w={130} h={36} r={8} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 102, borderRadius: 14 }} />
        ))}
      </div>
      <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <Sk w={100} h={10} r={4} /><Sk w={50} h={10} r={4} />
        </div>
        <Sk w="100%" h={8} r={4} />
      </div>
      <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", padding: "16px 20px" }}>
        <Sk w={70} h={10} r={4} />
        <div style={{ marginTop: 12 }}><Sk w="100%" h={40} r={8} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <Sk w={140} h={13} r={4} /><Sk w={80} h={10} r={4} />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--bg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sk w={7} h={7} r="50%" />
                <div><Sk w={130} h={13} r={4} /><div style={{ marginTop: 4 }}><Sk w={90} h={10} r={4} /></div></div>
              </div>
              <Sk w={52} h={13} r={4} />
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", padding: "16px 20px" }}>
          <Sk w={160} h={13} r={4} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 170, marginTop: 20, paddingBottom: 4 }}>
            {[55, 80, 40, 95, 60, 45, 75, 50].map((pct, i) => (
              <div key={i} className="skeleton" style={{ flex: 1, height: `${pct}%`, borderRadius: "4px 4px 0 0" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Add (outside Dashboard to prevent remount) ──────────
function QuickAdd({ onAdded }) {
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
    if (!title.trim())                             return setErr("Title is required");
    if (!amount || isNaN(+amount) || +amount <= 0) return setErr("Enter a valid amount");
    setSaving(true);
    try {
      await expensesAPI.create({
        title: title.trim(), amount: parseFloat(amount),
        category, transaction_date: today(), description: "",
      });
      setTitle(""); setAmount(""); setCategory("Food & Drinks");
      onAdded();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={S.qaWrap}>
      <div style={S.sectionLabel}>Quick add</div>
      <form onSubmit={submit} style={S.qaForm}>
        <input style={{ ...S.qaInp, flex: 2, minWidth: 140 }}
          placeholder="What did you spend on?"
          value={title} onChange={onTitleChange} />
        <input style={{ ...S.qaInp, flex: 1, minWidth: 90, maxWidth: 120 }}
          type="number" placeholder="Amount" min="0" step="0.01"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select style={{ ...S.qaInp, flex: 1, minWidth: 120, maxWidth: 160 }}
          value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button style={S.qaBtn} type="submit" disabled={saving}>
          {saving ? "Saving..." : "+ Add"}
        </button>
      </form>
      {err && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{err}</div>}
    </div>
  );
}

// ── Stat card ────
function Stat({ label, value, sub, gradient }) {
  return (
    <div style={{ ...S.statCard, background: gradient }}>
      <div style={S.statBlob} />
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  );
}

// ── Category pill ────
const catPill = (cat) => ({
  display: "inline-block",
  background: `${CAT_COLOR[cat] || "#6B7280"}22`,
  color: CAT_COLOR[cat] || "#6B7280",
  fontSize: 10, fontWeight: 600,
  padding: "1px 6px", borderRadius: 8, marginRight: 4,
});

// ── Dashboard ────
export default function Dashboard({ onNavigate }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState(null);

  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const load = () => {
    Promise.all([expensesAPI.getAll(), budgetAPI.get()])
      .then(([eR, bR]) => {
        setExpenses(eR.expenses || []);
        setBudget(bR.budget || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const thisMonth    = useMemo(() => expenses.filter((e) => e.transaction_date?.startsWith(monthKey)), [expenses, monthKey]);
  const totalSpent   = useMemo(() => thisMonth.reduce((s, e) => s + Number(e.amount), 0), [thisMonth]);
  const monthlyLimit = budget?.monthly_limit ?? 0;
  const remaining    = monthlyLimit - totalSpent;
  const pct          = monthlyLimit > 0 ? Math.min(100, (totalSpent / monthlyLimit) * 100) : 0;
  const streak       = useMemo(() => calcStreak(expenses), [expenses]);
  const frequent     = useMemo(() => getFrequent(expenses), [expenses]);

  const chartData = useMemo(() => {
    const m = {};
    thisMonth.forEach((e) => { m[e.category] = (m[e.category] || 0) + Number(e.amount); });
    return Object.entries(m)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }, [thisMonth]);

  const recent = useMemo(() =>
    [...expenses]
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 10),
    [expenses]
  );

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete "${exp.title}"?`)) return;
    setDeleting(exp.expense_id);
    try {
      await expensesAPI.remove(exp.expense_id);
      setExpenses((p) => p.filter((e) => e.expense_id !== exp.expense_id));
    } catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  };

  const handleRepeat = async (freq) => {
    try {
      await expensesAPI.create({
        title: freq.title, amount: freq.amount,
        category: freq.category, transaction_date: today(), description: "",
      });
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <DashSkeleton />;

  const firstName = user?.full_name?.split(" ")[0] || user?.username;

  const spentGrad  = "linear-gradient(135deg, #1e40af 0%, #4f46e5 100%)";
  const remainGrad = monthlyLimit === 0
    ? "linear-gradient(135deg, #374151 0%, #4B5563 100%)"
    : remaining < 0
      ? "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)"
      : "linear-gradient(135deg, #065f46 0%, #059669 100%)";
  const txGrad = "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)";

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={S.header}>
        <div>
          <h1 style={S.h1}>
            {getGreeting()},{" "}
            <span style={S.nameGrad}>{firstName}</span>
          </h1>
          <div style={S.meta}>
            {now.toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })}
            {streak > 0 && <span style={S.streak}>{streak}-day streak</span>}
          </div>
        </div>
        <button style={S.primaryBtn} onClick={() => onNavigate("add-expense", null)}>
          + New expense
        </button>
      </div>

      {error && <div style={S.alert}>{error}</div>}

      <div style={S.statsGrid}>
        <Stat label="Spent this month" value={fmt(totalSpent)}
          sub={monthlyLimit > 0 ? `of ${fmt(monthlyLimit)}` : "no budget set"} gradient={spentGrad} />
        <Stat label="Remaining"
          value={monthlyLimit > 0 ? fmt(Math.abs(remaining)) : "-"}
          sub={remaining < 0 ? "over budget" : monthlyLimit > 0 ? "left to spend" : "set a budget"}
          gradient={remainGrad} />
        <Stat label="Transactions" value={thisMonth.length} sub="this month" gradient={txGrad} />
      </div>

      <TipCard />

      {monthlyLimit > 0 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
            <span style={S.sectionLabel}>Monthly budget</span>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{pct.toFixed(0)}% used</span>
          </div>
          <div style={S.barTrack}>
            <div style={{
              ...S.barFill, width: `${pct}%`,
              background: pct > 90
                ? "linear-gradient(90deg, #dc2626, #ef4444)"
                : pct > 70
                  ? "linear-gradient(90deg, #d97706, #f59e0b)"
                  : "linear-gradient(90deg, #16a34a, #22c55e)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={S.barLabel}>{fmt(totalSpent)} spent</span>
            <span style={S.barLabel}>{fmt(monthlyLimit)} limit</span>
          </div>
        </div>
      )}

      <QuickAdd onAdded={load} />

      {frequent.length > 0 && (
        <div style={S.freqRow}>
          <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500, flexShrink: 0 }}>Repeat</span>
          {frequent.map((f) => (
            <button key={f.title} style={S.freqChip} onClick={() => handleRepeat(f)}>
              {f.title} · {fmt(f.amount)}
            </button>
          ))}
        </div>
      )}

      <div style={S.bottomGrid}>
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>Recent expenses</span>
            <span style={{ fontSize: 12, color: "var(--text-4)" }}>{thisMonth.length} this month</span>
          </div>
          {recent.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
              <div style={{ fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>No expenses yet</div>
              <div style={{ fontSize: 12, color: "var(--text-4)" }}>Use Quick Add above to log your first one.</div>
            </div>
          ) : recent.map((exp) => (
            <div
              key={exp.expense_id}
              style={S.expRow}
              onMouseEnter={(e) => e.currentTarget.querySelector(".ea").style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.querySelector(".ea").style.opacity = "0"}
            >
              <div style={S.expLeft}>
                <span style={{ ...S.dot, background: CAT_COLOR[exp.category] || "#6B7280" }} />
                <div style={{ minWidth: 0 }}>
                  <div style={S.expTitle}>{exp.title}</div>
                  <div style={S.expMeta}>
                    <span style={catPill(exp.category)}>{exp.category}</span>
                    {exp.transaction_date}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={S.expAmt}>{fmt(exp.amount)}</span>
                <div className="ea" style={S.expActions}>
                  <button style={S.actEdit} onClick={() => onNavigate("add-expense", exp)}>Edit</button>
                  <button style={S.actDel} onClick={() => handleDelete(exp)} disabled={deleting === exp.expense_id}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {chartData.length > 0 ? (
          <div style={S.card}>
            <div style={S.cardHead}><span style={S.cardTitle}>Spending by category</span></div>
            <ResponsiveContainer width="100%" height={228}>
              <BarChart data={chartData} barSize={22} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-4)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => fmt(v)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "var(--shadow-lg)", color: "var(--text)" }}
                  cursor={{ fill: "var(--bg)" }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {chartData.map((e) => <Cell key={e.name} fill={CAT_COLOR[e.name] || "#6B7280"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>No chart data yet</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>Add expenses to see your breakdown.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  h1:         { fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", lineHeight: 1.2 },
  nameGrad:   { background: "linear-gradient(135deg, #818CF8, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" },
  meta:       { fontSize: 13, color: "var(--text-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 10 },
  streak:     { background: "linear-gradient(135deg, #f59e0b22, #fb923c22)", border: "1px solid #f59e0b44", borderRadius: 20, padding: "2px 9px", fontSize: 11, color: "var(--orange)", fontWeight: 700 },
  primaryBtn: { background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.1px", flexShrink: 0, boxShadow: "0 2px 10px rgba(37,99,235,0.25)" },
  alert:      { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: 13 },
  statsGrid:  { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  statCard:   { borderRadius: 14, padding: "20px 22px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", position: "relative", overflow: "hidden" },
  statBlob:   { position: "absolute", top: -24, right: -24, width: 88, height: 88, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" },
  statLabel:  { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, position: "relative" },
  statValue:  { fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1, position: "relative" },
  statSub:    { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6, position: "relative" },
  card:       { background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 20px", boxShadow: "var(--shadow)" },
  cardHead:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle:  { fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.1px" },
  sectionLabel:{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 },
  barTrack:   { background: "var(--bg)", borderRadius: 6, height: 8, overflow: "hidden" },
  barFill:    { height: "100%", borderRadius: 6, transition: "width 0.6s ease" },
  barLabel:   { fontSize: 11, color: "var(--text-4)" },
  qaWrap:     { background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "14px 18px", boxShadow: "var(--shadow)" },
  qaForm:     { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  qaInp:      { border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, color: "var(--text)", background: "var(--bg)", flex: 1, boxSizing: "border-box" },
  qaBtn:      { background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },
  freqRow:    { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  freqChip:   { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "var(--text-2)", cursor: "pointer", boxShadow: "var(--shadow)", fontWeight: 500 },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  expRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--bg)" },
  expLeft:    { display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 },
  dot:        { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  expTitle:   { fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 },
  expMeta:    { fontSize: 11, color: "var(--text-4)", marginTop: 2 },
  expAmt:     { fontSize: 13, fontWeight: 700, color: "var(--text)" },
  expActions: { display: "flex", gap: 2, opacity: 0, transition: "opacity 0.12s" },
  actEdit:    { background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--primary)", padding: "2px 5px" },
  actDel:     { background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--red)", padding: "2px 5px" },
  empty:      { textAlign: "center", padding: "28px 0" },
  tipBtn:     { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 9px", fontSize: 15, color: "var(--text-3)", cursor: "pointer", fontWeight: 600, lineHeight: 1 },
};
