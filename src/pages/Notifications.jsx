import { useEffect, useState } from "react";
import { notificationsAPI } from "../services/api";

const LEVEL_STYLES = {
  low: { border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8" },
  medium: { border: "1px solid #FDE68A", background: "#FFFBEB", color: "#B45309" },
  high: { border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C" },
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    notificationsAPI.getAll()
      .then((res) => setItems(res.notifications || []))
      .catch((err) => setError(err.message || "Failed to load notifications."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ fontSize: 14, color: "var(--text-3)" }}>Loading notifications...</div>;
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
      <header>
        <h1 style={s.h1}>Notifications</h1>
        <p style={s.subtitle}>Budget alerts and account reminders appear here.</p>
      </header>

      {error && <div style={s.alert}>{error}</div>}

      {!items.length ? (
        <div style={s.empty}>No notifications right now.</div>
      ) : (
        items.map((item) => (
          <article key={item.notification_id} style={{ ...s.item, ...(LEVEL_STYLES[item.level] || LEVEL_STYLES.low) }}>
            <div style={s.itemTitle}>{item.title}</div>
            <div style={s.itemMsg}>{item.message}</div>
          </article>
        ))
      )}
    </div>
  );
}

const s = {
  h1: { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle: { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  alert: { background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: "var(--fs-sm)" },
  empty: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", color: "var(--text-4)", fontSize: "var(--fs-sm)" },
  item: { borderRadius: 10, padding: "16px 18px", boxShadow: "var(--shadow)" },
  itemTitle: { fontSize: "var(--fs-sm)", fontWeight: 700, marginBottom: 6 },
  itemMsg: { fontSize: "var(--fs-sm)", lineHeight: 1.6 },
};
