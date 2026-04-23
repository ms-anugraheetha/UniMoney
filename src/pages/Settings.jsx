import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { budgetAPI } from "../services/api";

function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", flexShrink: 0 }} aria-label={label}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <div style={{ position: "relative", width: 44, height: 24, borderRadius: 24, flexShrink: 0, background: checked ? "var(--primary)" : "var(--border-strong)", transition: "background 0.2s" }}>
        <div style={{ position: "absolute", top: 3, borderRadius: "50%", width: 18, height: 18, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", left: checked ? "calc(100% - 21px)" : "3px", transition: "left 0.2s" }} />
      </div>
    </label>
  );
}

function Section({ title, children }) {
  const id = `section-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section style={s.section} aria-labelledby={id}>
      <h2 id={id} style={s.sectionTitle}>{title}</h2>
      <div style={s.sectionBody}>{children}</div>
    </section>
  );
}

function SettingRow({ label, description, control }) {
  return (
    <div style={s.row}>
      <div style={{ minWidth: 0 }}>
        <div style={s.rowLabel}>{label}</div>
        {description && <div style={s.rowDesc}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

const FONT_SIZES = ["sm", "md", "lg"];
const FONT_SIZE_IDX = { sm: 0, md: 1, lg: 2 };

export default function Settings() {
  const { logout } = useAuth();
  const { t } = useLanguage();

  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState("");

  const [dark, setDark] = useState(() => document.documentElement.getAttribute("data-theme") === "dark");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("um_fontsize") || "md");
  const [dyslexia, setDyslexia] = useState(() => localStorage.getItem("um_dyslexia") === "1");
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("um_motion") === "reduce");

  useEffect(() => {
    const saved = localStorage.getItem("um_fontsize") || "md";
    document.documentElement.setAttribute("data-fontsize", saved);
  }, []);

  useEffect(() => {
    budgetAPI.get().then((r) => { if (r.budget) setBudgetLimit(r.budget.monthly_limit ?? ""); }).catch(() => {});
  }, []);

  const saveBudget = async (e) => {
    e.preventDefault();
    setBudgetMsg("");
    if (!budgetLimit || isNaN(+budgetLimit) || +budgetLimit <= 0) {
      setBudgetMsg("error:" + t("settings.validAmount"));
      return;
    }
    setBudgetSaving(true);
    try {
      const now = new Date();
      await budgetAPI.save({ month: now.getMonth() + 1, year: now.getFullYear(), monthly_limit: parseFloat(budgetLimit) });
      setBudgetMsg("ok:" + t("settings.budgetSaved"));
    } catch (err) {
      setBudgetMsg("error:" + (err.message || "Failed to save."));
    } finally {
      setBudgetSaving(false);
    }
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
    localStorage.setItem("um_theme", next ? "dark" : "light");
  };

  const changeFont = (size) => {
    setFontSize(size);
    document.documentElement.setAttribute("data-fontsize", size);
    localStorage.setItem("um_fontsize", size);
  };

  const toggleDyslexia = () => {
    const next = !dyslexia;
    setDyslexia(next);
    document.documentElement.setAttribute("data-dyslexia", next ? "1" : "");
    localStorage.setItem("um_dyslexia", next ? "1" : "0");
  };

  const toggleMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    document.documentElement.setAttribute("data-motion", next ? "reduce" : "");
    localStorage.setItem("um_motion", next ? "reduce" : "");
  };

  const msgStyle = (msg) => msg.startsWith("ok:") ? s.msgOk : s.msgErr;
  const msgText = (msg) => msg.replace(/^(ok|error):/, "");

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 620 }}>
      <header>
        <h1 style={s.h1}>{t("settings.title")}</h1>
        <p style={s.subtitle}>{t("settings.subtitle")}</p>
      </header>

      <Section title={t("settings.monthlyBudget")}>
        <form onSubmit={saveBudget} noValidate>
          <label htmlFor="budget-input" style={s.fieldLabel}>{t("settings.limit")}</label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <input id="budget-input" type="number" min="0" step="0.01" value={budgetLimit} onChange={(e) => { setBudgetLimit(e.target.value); setBudgetMsg(""); }} placeholder="e.g. 800" style={{ ...s.input, flex: 1 }} aria-describedby={budgetMsg ? "budget-msg" : undefined} />
            <button type="submit" style={s.saveBtn} disabled={budgetSaving}>{budgetSaving ? t("settings.saving") : t("settings.save")}</button>
          </div>
          {budgetMsg && <div id="budget-msg" role="alert" style={msgStyle(budgetMsg)}>{msgText(budgetMsg)}</div>}
        </form>
      </Section>

      <hr style={s.divider} />

      <Section title={t("settings.appearance")}>
        <SettingRow label={t("settings.darkMode")} description={t("settings.darkModeDesc")} control={<Toggle id="dark-toggle" checked={dark} onChange={toggleDark} label="Toggle dark mode" />} />
        <hr style={s.rowDivider} />
        <SettingRow
          label={t("settings.fontSize")}
          description={t("settings.fontSizeDesc")}
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-4)", fontWeight: 600, minWidth: 18 }}>A-</span>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={FONT_SIZE_IDX[fontSize]}
                onChange={(e) => changeFont(FONT_SIZES[+e.target.value])}
                aria-label="Font size"
                style={s.slider}
              />
              <span style={{ fontSize: "var(--fs-md)", color: "var(--text-4)", fontWeight: 600, minWidth: 22, textAlign: "right" }}>A+</span>
            </div>
          }
        />
      </Section>

      <hr style={s.divider} />

      <Section title={t("settings.accessibility")}>
        <SettingRow label={t("settings.dyslexiaFont")} description={t("settings.dyslexiaDesc")} control={<Toggle id="dyslexia-toggle" checked={dyslexia} onChange={toggleDyslexia} label="Toggle dyslexia-friendly font" />} />
        <hr style={s.rowDivider} />
        <SettingRow label={t("settings.reduceMotion")} description={t("settings.motionDesc")} control={<Toggle id="motion-toggle" checked={reducedMotion} onChange={toggleMotion} label="Toggle reduced motion" />} />
      </Section>

      <hr style={s.divider} />

      <Section title={t("settings.account")}>
        <button style={s.signOutBtn} onClick={logout} aria-label="Sign out of your account">{t("settings.signOut")}</button>
      </Section>
    </div>
  );
}

const s = {
  h1: { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle: { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  section: { display: "flex", flexDirection: "column", gap: 0 },
  sectionTitle: { fontSize: "var(--fs-md)", fontWeight: 600, color: "var(--text)", marginBottom: 14, letterSpacing: "-0.1px" },
  sectionBody: { display: "flex", flexDirection: "column" },
  divider: { border: "none", borderTop: "1px solid var(--border)", margin: 0 },
  rowDivider: { border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "4px 0" },
  rowLabel: { fontSize: "var(--fs-base)", fontWeight: 500, color: "var(--text)" },
  rowDesc: { fontSize: "var(--fs-xs)", color: "var(--text-4)", marginTop: 2 },
  fieldLabel: { fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-3)" },
  input: { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 13px", fontSize: "var(--fs-base)", color: "var(--text)", background: "var(--card)", boxSizing: "border-box" },
  saveBtn: { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  sizeBtn: { borderRadius: 7, padding: "6px 12px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", transition: "background 0.15s" },
  slider: { flex: 1, appearance: "none", WebkitAppearance: "none", height: 5, borderRadius: 4, background: "var(--border-strong)", outline: "none", cursor: "pointer", accentColor: "var(--primary)" },
  msgOk: { fontSize: "var(--fs-xs)", color: "var(--green)", marginTop: 8 },
  msgErr: { fontSize: "var(--fs-xs)", color: "var(--red)", marginTop: 8 },
  signOutBtn: { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 20px", fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-3)", cursor: "pointer", alignSelf: "flex-start" },
};
