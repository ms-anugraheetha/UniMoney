import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Check both storages — localStorage (remember me) and sessionStorage (session only)
      const stored =
        localStorage.getItem("unimoney_user") ||
        sessionStorage.getItem("unimoney_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /**
   * login(userData, token, remember)
   * remember = true  → persist in localStorage (survives browser close)
   * remember = false → persist in sessionStorage (cleared when browser closes)
   */
  const login = useCallback((userData, token, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("unimoney_token", token);
    storage.setItem("unimoney_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("unimoney_token");
    localStorage.removeItem("unimoney_user");
    sessionStorage.removeItem("unimoney_token");
    sessionStorage.removeItem("unimoney_user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      // Persist to whichever storage has the user
      if (localStorage.getItem("unimoney_user")) {
        localStorage.setItem("unimoney_user", JSON.stringify(next));
      } else {
        sessionStorage.setItem("unimoney_user", JSON.stringify(next));
      }
      // Also update the local DB user list (offline mode)
      const token =
        localStorage.getItem("unimoney_token") ||
        sessionStorage.getItem("unimoney_token");
      if (token?.startsWith("local_")) {
        try {
          const users = JSON.parse(localStorage.getItem("um_users") || "[]");
          const patched = users.map((u) =>
            u.user_id === next.user_id ? { ...u, ...updates } : u
          );
          localStorage.setItem("um_users", JSON.stringify(patched));
        } catch {}
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
