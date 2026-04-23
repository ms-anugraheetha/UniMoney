import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { authAPI } from "../services/api";

function initials(name) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const avatarKey = `um_avatar_${user?.user_id}`;

  const [name,           setName]           = useState(user?.full_name || "");
  const [avatar,         setAvatar]         = useState(() => localStorage.getItem(avatarKey) || "");
  const [saving,         setSaving]         = useState(false);
  const [msg,            setMsg]            = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState("");
  const [deleting,       setDeleting]       = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setAvatar(dataUrl);
      localStorage.setItem(avatarKey, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMsg("");
    if (!name.trim()) { setMsg("error:" + t("profile.nameRequired")); return; }
    setSaving(true);
    try {
      updateUser({ full_name: name.trim() });
      setMsg("ok:" + t("profile.saved"));
    } catch {
      setMsg("error:Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwMsg("error:Please fill in all password fields.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg("error:New password must be at least 8 characters.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg("error:New passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg("ok:Password updated.");
    } catch (err) {
      setPwMsg(`error:${err.message || "Failed to update password."}`);
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toLowerCase() !== "delete") return;
    setDeleting(true);
    try {
      // Remove all local user data
      const keys = Object.keys(localStorage).filter(k =>
        k.includes(user?.user_id) || k === "unimoney_user" || k === "unimoney_token" ||
        k === "um_pin" || k === "um_theme" || k === "um_fontsize" ||
        k === "um_dyslexia" || k === "um_motion" || k === "um_lang"
      );
      keys.forEach(k => localStorage.removeItem(k));
      // Remove from local user list
      try {
        const users = JSON.parse(localStorage.getItem("um_users") || "[]");
        const filtered = users.filter(u => u.user_id !== user?.user_id);
        localStorage.setItem("um_users", JSON.stringify(filtered));
      } catch {}
      logout();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const msgStyle = (m) => m.startsWith("ok:") ? s.msgOk : s.msgErr;
  const msgText  = (m) => m.replace(/^(ok|error):/, "");

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 520 }}>
      <header>
        <h1 style={s.h1}>{t("profile.title")}</h1>
        <p style={s.subtitle}>{t("profile.subtitle")}</p>
      </header>

      {/* Avatar */}
      <section style={s.section} aria-label="Profile picture">
        <div style={s.avatarWrap}>
          <div style={s.avatarOuter} onClick={() => fileRef.current?.click()} role="button" tabIndex={0} aria-label={t("profile.changePicture")} onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}>
            {avatar ? (
              <img src={avatar} alt="Profile" style={s.avatarImg} />
            ) : (
              <div style={s.avatarFallback} aria-hidden="true">
                {initials(name || user?.full_name)}
              </div>
            )}
            <div style={s.avatarOverlay} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} aria-label="Upload profile picture" />
          <button style={s.changePicBtn} onClick={() => fileRef.current?.click()} type="button">
            {t("profile.changePicture")}
          </button>
        </div>
      </section>

      <hr style={s.divider} />

      {/* Form */}
      <form onSubmit={handleSave} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label htmlFor="full-name" style={s.fieldLabel}>{t("profile.displayName")}</label>
          <input
            id="full-name"
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setMsg(""); }}
            placeholder="Your name"
            style={{ ...s.input, width: "100%", marginTop: 6 }}
            aria-describedby={msg ? "profile-msg" : undefined}
          />
        </div>

        <div>
          <label style={s.fieldLabel}>{t("profile.email")}</label>
          <div style={s.readOnly}>{user?.email || "—"}</div>
        </div>

        <div>
          <label style={s.fieldLabel}>{t("profile.username")}</label>
          <div style={s.readOnly}>{user?.username || "—"}</div>
        </div>

        {msg && (
          <div id="profile-msg" role="alert" style={msgStyle(msg)}>
            {msgText(msg)}
          </div>
        )}

        <button type="submit" style={s.saveBtn} disabled={saving}>
          {saving ? t("profile.saving") : t("profile.saveChanges")}
        </button>
      </form>

      <hr style={s.divider} />

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Password change">
        <h2 style={s.sectionTitle}>Change password</h2>
        <form onSubmit={handlePasswordChange} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={s.fieldLabel}>Current password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              style={{ ...s.input, width: "100%", marginTop: 6 }}
            />
          </div>
          <div>
            <label style={s.fieldLabel}>New password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              style={{ ...s.input, width: "100%", marginTop: 6 }}
            />
          </div>
          <div>
            <label style={s.fieldLabel}>Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              style={{ ...s.input, width: "100%", marginTop: 6 }}
            />
          </div>
          {pwMsg && <div role="alert" style={msgStyle(pwMsg)}>{msgText(pwMsg)}</div>}
          <button type="submit" style={s.saveBtn} disabled={pwSaving}>
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>

      <hr style={s.divider} />

      {/* Account actions */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-label="Account actions">
        <h2 style={s.sectionTitle}>{t("profile.accountActions")}</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button style={s.logoutBtn} onClick={handleLogout} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t("profile.signOut")}
          </button>
          <button style={s.deleteBtn} onClick={() => { setShowDeleteModal(true); setDeleteConfirm(""); }} type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            {t("profile.deleteAccount")}
          </button>
        </div>
      </section>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div style={s.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div style={s.modal}>
            <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">⚠️</div>
            <h2 id="delete-title" style={s.modalTitle}>{t("profile.deleteTitle")}</h2>
            <p style={s.modalDesc}>{t("profile.deleteDesc")}</p>
            <label htmlFor="delete-confirm" style={s.fieldLabel}>{t("profile.deleteConfirmLabel")}</label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="delete"
              style={{ ...s.input, width: "100%", marginTop: 6, marginBottom: 16 }}
              autoComplete="off"
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.cancelBtn} onClick={() => setShowDeleteModal(false)} type="button" disabled={deleting}>
                {t("profile.cancel")}
              </button>
              <button
                style={{ ...s.deleteBtn, flex: 1, justifyContent: "center", opacity: deleteConfirm.trim().toLowerCase() !== "delete" ? 0.45 : 1 }}
                onClick={handleDeleteAccount}
                type="button"
                disabled={deleteConfirm.trim().toLowerCase() !== "delete" || deleting}
              >
                {deleting ? t("profile.deleting") : t("profile.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  h1:            { fontSize: "var(--fs-3xl)", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" },
  subtitle:      { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginTop: 4 },
  section:       { display: "flex", flexDirection: "column", gap: 0 },
  sectionTitle:  { fontSize: "var(--fs-md)", fontWeight: 600, color: "var(--text)", marginBottom: 10 },
  divider:       { border: "none", borderTop: "1px solid var(--border)", margin: "4px 0" },
  avatarWrap:    { display: "flex", alignItems: "center", gap: 20 },
  avatarOuter:   { position: "relative", width: 88, height: 88, borderRadius: "50%", cursor: "pointer", flexShrink: 0, outline: "none" },
  avatarImg:     { width: 88, height: 88, borderRadius: "50%", objectFit: "cover", display: "block" },
  avatarFallback: { width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-2xl)", fontWeight: 700, color: "#fff" },
  avatarOverlay:  { position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" },
  changePicBtn:   { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", fontSize: "var(--fs-sm)", color: "var(--text-3)", cursor: "pointer", fontWeight: 500 },
  fieldLabel:    { fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-3)", display: "block" },
  input:         { border: "1px solid var(--border)", borderRadius: 8, padding: "10px 13px", fontSize: "var(--fs-sm)", color: "var(--text)", background: "var(--card)", boxSizing: "border-box" },
  readOnly:      { marginTop: 6, padding: "10px 13px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "var(--fs-sm)", color: "var(--text-3)" },
  msgOk:         { fontSize: "var(--fs-xs)", color: "var(--green)" },
  msgErr:        { fontSize: "var(--fs-xs)", color: "var(--red)" },
  saveBtn:       { background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" },
  logoutBtn:     { display: "flex", alignItems: "center", gap: 7, background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 18px", fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-3)", cursor: "pointer" },
  deleteBtn:     { display: "flex", alignItems: "center", gap: 7, background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 18px", fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--red)", cursor: "pointer" },
  cancelBtn:     { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 18px", fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-3)", cursor: "pointer", flex: 1 },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 },
  modal:         { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 28px", maxWidth: 420, width: "100%", boxShadow: "var(--shadow-lg)", textAlign: "center" },
  modalTitle:    { fontSize: "var(--fs-xl)", fontWeight: 700, color: "var(--text)", marginBottom: 8 },
  modalDesc:     { fontSize: "var(--fs-sm)", color: "var(--text-3)", marginBottom: 20, lineHeight: 1.6 },
};
