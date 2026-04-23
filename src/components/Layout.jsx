import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h.01" /><path d="M6 9h4" /><path d="M6 15h6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function initials(name) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Layout({ children, currentPage, onNavigate }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const name = user?.full_name || user?.username || "";
  const avatarKey = `um_avatar_${user?.user_id}`;
  const avatar = localStorage.getItem(avatarKey) || "";

  const NAV = [
    { id: "home", label: t("nav.home"), Icon: HomeIcon },
    { id: "add-expense", label: t("nav.addExpense"), Icon: BudgetIcon },
    { id: "history", label: t("nav.history"), Icon: HistoryIcon },
    { id: "budget", label: t("nav.budget"), Icon: BudgetIcon },
    { id: "reports", label: t("nav.reports"), Icon: ReportsIcon },
    { id: "notifications", label: t("nav.notifications"), Icon: BellIcon },
    { id: "settings", label: t("nav.settings"), Icon: SettingsIcon },
  ];

  return (
    <div style={s.shell}>
      <aside style={s.sidebar} aria-label="Main navigation">
        <div style={s.brand}>
          <div style={s.brandName}>UniMoney</div>
          <div style={s.brandSub}>Student Finance</div>
        </div>

        <nav style={s.nav} role="navigation">
          {NAV.map(({ id, label, Icon }) => {
            const active = currentPage === id || (currentPage === "dashboard" && id === "home");
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={{ ...s.navBtn, ...(active ? s.navActive : {}) }}
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                {label}
              </button>
            );
          })}
        </nav>

        <button
          style={s.userCard}
          onClick={() => onNavigate("profile")}
          aria-label={`Go to profile - ${name}`}
        >
          <div style={s.avatarWrap} aria-hidden="true">
            {avatar ? (
              <img src={avatar} alt="" style={s.avatarImg} />
            ) : (
              <div style={s.avatar}>{initials(name)}</div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={s.userName}>{name}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
        </button>
      </aside>

      <main id="main-content" style={s.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

const s = {
  shell: { display: "flex", minHeight: "100vh", background: "var(--bg)" },
  sidebar: { width: 232, flexShrink: 0, background: "#111827", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.05)" },
  brand: { padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  brandName: { fontSize: 17, fontWeight: 700, color: "#F9FAFB", letterSpacing: "-0.3px" },
  brandSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  nav: { flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#6B7280", fontSize: 13, fontWeight: 400, cursor: "pointer", transition: "background 0.15s, color 0.15s" },
  navActive: { background: "rgba(255,255,255,0.09)", color: "#F9FAFB", fontWeight: 600 },
  userCard: { padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", transition: "background 0.15s" },
  avatarWrap: { flexShrink: 0, width: 32, height: 32 },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" },
  avatarImg: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block" },
  userName: { fontSize: 13, fontWeight: 500, color: "#E5E7EB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userEmail: { fontSize: 11, color: "#6B7280", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  main: { flex: 1, padding: "36px 40px", overflowY: "auto", minWidth: 0, background: "var(--bg)" },
};
