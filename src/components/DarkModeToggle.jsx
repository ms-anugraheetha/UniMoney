import { useState } from "react";

// Read the theme that was already applied by the inline script in index.html
function getInitialDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

export default function DarkModeToggle() {
  const [dark, setDark] = useState(getInitialDark);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
    localStorage.setItem("um_theme", next ? "dark" : "light");
  };

  return (
    <button onClick={toggle} style={s.btn}>
      {dark ? "☀ Light mode" : "◑ Dark mode"}
    </button>
  );
}

const s = {
  btn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 6,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#9CA3AF",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    letterSpacing: "0.01em",
  },
};