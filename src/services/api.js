const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getToken = () =>
  localStorage.getItem("unimoney_token") ||
  sessionStorage.getItem("unimoney_token");

const authHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });
  const contentType = res.headers.get("content-type") || "";
  const raw = await res.text();

  let data = null;
  if (raw) {
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new TypeError("API returned invalid JSON.");
      }
    } else if (raw.trim().startsWith("<!DOCTYPE") || raw.trim().startsWith("<html")) {
      throw new TypeError("API returned HTML instead of JSON.");
    } else {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new TypeError("API returned a non-JSON response.");
      }
    }
  }

  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

const isOffline = (err) =>
  err instanceof TypeError ||
  err.message?.toLowerCase().includes("failed to fetch") ||
  err.message?.toLowerCase().includes("networkerror") ||
  err.message?.toLowerCase().includes("load failed") ||
  err.message?.toLowerCase().includes("invalid json") ||
  err.message?.toLowerCase().includes("non-json response") ||
  err.message?.toLowerCase().includes("html instead of json");

const uid = () => Math.random().toString(36).slice(2, 11);

const normalizeBudgets = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const migrateLegacyBudgets = () => {
  if (typeof window === "undefined") return;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith("um_bud_")) continue;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = normalizeBudgets(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        localStorage.setItem(key, JSON.stringify(normalized));
      }
    } catch {
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
};

migrateLegacyBudgets();

const DB = {
  getUsers:     ()          => { try { return JSON.parse(localStorage.getItem("um_users")          || "[]");   } catch { return []; }   },
  saveUsers:    (v)         => localStorage.setItem("um_users", JSON.stringify(v)),
  getExpenses:  (userId)    => { try { return JSON.parse(localStorage.getItem(`um_exp_${userId}`)  || "[]");   } catch { return []; }   },
  saveExpenses: (userId, v) => localStorage.setItem(`um_exp_${userId}`, JSON.stringify(v)),
  getBudgets:   (userId)    => {
    try {
      return normalizeBudgets(JSON.parse(localStorage.getItem(`um_bud_${userId}`) || "[]"));
    } catch {
      return [];
    }
  },
  saveBudgets:  (userId, v) => localStorage.setItem(`um_bud_${userId}`, JSON.stringify(v)),
};

const getCurrentUserId = () => {
  const token = getToken();
  if (token?.startsWith("local_")) return token.slice(6);
  return null;
};

function localRegister({ fullName, email, username, password }) {
  const users = DB.getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("An account with this email already exists.");
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase()))
    throw new Error("This username is already taken.");
  const user = { user_id: uid(), full_name: fullName, email, username, _pw: password };
  DB.saveUsers([...users, user]);
  const { _pw, ...safe } = user;
  return { user: safe, token: `local_${user.user_id}` };
}

function localLogin({ identifier, password }) {
  const users = DB.getUsers();
  const id = identifier.trim().toLowerCase();
  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === id || u.username.toLowerCase() === id) &&
      u._pw === password
  );
  if (!user) throw new Error("Incorrect email/username or password.");
  const { _pw, ...safe } = user;
  return { user: safe, token: `local_${user.user_id}` };
}

function requireUserId() {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

function localGetExpenses() {
  return { expenses: DB.getExpenses(requireUserId()) };
}

function localCreateExpense(body) {
  const userId = requireUserId();
  const expenses = DB.getExpenses(userId);
  const expense = { expense_id: uid(), user_id: userId, ...body };
  DB.saveExpenses(userId, [...expenses, expense]);
  return { expense };
}

function localUpdateExpense(id, body) {
  const userId = requireUserId();
  const expenses = DB.getExpenses(userId).map((e) =>
    e.expense_id === id ? { ...e, ...body } : e
  );
  DB.saveExpenses(userId, expenses);
  return { expense: expenses.find((e) => e.expense_id === id) };
}

function localDeleteExpense(id) {
  const userId = requireUserId();
  DB.saveExpenses(userId, DB.getExpenses(userId).filter((e) => e.expense_id !== id));
  return { success: true };
}

function localGetBudget(params = {}) {
  const userId = requireUserId();
  const now = new Date();
  const targetMonth = Number(params.month || now.getMonth() + 1);
  const targetYear = Number(params.year || now.getFullYear());
  const budget = normalizeBudgets(DB.getBudgets(userId)).find(
    (item) => Number(item.month) === targetMonth && Number(item.year) === targetYear
  );
  return { budget: budget || null };
}

function localSaveBudget(body) {
  const userId = requireUserId();
  const budgets = normalizeBudgets(DB.getBudgets(userId));
  const existing = budgets.find(
    (item) => Number(item.month) === Number(body.month) && Number(item.year) === Number(body.year)
  );
  const budget = existing
    ? { ...existing, ...body }
    : { budget_id: uid(), user_id: userId, ...body };
  const nextBudgets = existing
    ? budgets.map((item) => (item.budget_id === existing.budget_id ? budget : item))
    : [...budgets, budget];
  DB.saveBudgets(userId, nextBudgets);
  return { budget };
}

function localChangePassword({ currentPassword, newPassword }) {
  const userId = requireUserId();
  const users = DB.getUsers();
  const user = users.find((u) => u.user_id === userId);
  if (!user) throw new Error("User not found.");
  if (user._pw !== currentPassword) throw new Error("Current password is incorrect.");
  user._pw = newPassword;
  DB.saveUsers([...users]);
  return { success: true };
}

function localGetNotifications() {
  const userId = requireUserId();
  const expenses = DB.getExpenses(userId);
  const notifications = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const budget = normalizeBudgets(DB.getBudgets(userId)).find(
    (item) => Number(item.month) === currentMonth && Number(item.year) === currentYear
  );
  const thisMonth = expenses.filter((e) => e.transaction_date?.startsWith(monthKey));
  const totalSpent = thisMonth.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if (budget?.monthly_limit > 0) {
    const pct = (totalSpent / Number(budget.monthly_limit)) * 100;
    if (pct >= 100) {
      notifications.push({
        notification_id: "budget-exceeded",
        level: "high",
        title: "Budget exceeded",
        message: `You have spent ${totalSpent.toFixed(2)} out of ${Number(budget.monthly_limit).toFixed(2)} this month.`,
        created_at: now.toISOString(),
      });
    } else if (pct >= 90) {
      notifications.push({
        notification_id: "budget-warning-90",
        level: "medium",
        title: "Budget warning",
        message: `You have used ${pct.toFixed(0)}% of your monthly budget.`,
        created_at: now.toISOString(),
      });
    } else if (pct >= 75) {
      notifications.push({
        notification_id: "budget-warning-75",
        level: "low",
        title: "Budget check-in",
        message: `You have used ${pct.toFixed(0)}% of your monthly budget.`,
        created_at: now.toISOString(),
      });
    }
  }

  if (!expenses.length) {
    notifications.push({
      notification_id: "welcome-start",
      level: "low",
      title: "Start tracking",
      message: "Add your first expense to begin building your spending history.",
      created_at: now.toISOString(),
    });
  }

  return { notifications };
}

export const authAPI = {
  register: async (body) => {
    try   { return await request("/auth/register", { method: "POST", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localRegister(body); throw err; }
  },
  login: async (body) => {
    try   { return await request("/auth/login", { method: "POST", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localLogin(body); throw err; }
  },
  changePassword: async (body) => {
    try   { return await request("/auth/change-password", { method: "POST", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localChangePassword(body); throw err; }
  },
};

export const expensesAPI = {
  getAll: async () => {
    try   { return await request("/expenses"); }
    catch (err) { if (isOffline(err)) return localGetExpenses(); throw err; }
  },
  create: async (body) => {
    try   { return await request("/expenses", { method: "POST", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localCreateExpense(body); throw err; }
  },
  update: async (id, body) => {
    try   { return await request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localUpdateExpense(id, body); throw err; }
  },
  remove: async (id) => {
    try   { return await request(`/expenses/${id}`, { method: "DELETE" }); }
    catch (err) { if (isOffline(err)) return localDeleteExpense(id); throw err; }
  },
};

export const budgetAPI = {
  get: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const path = query ? `/budget?${query}` : "/budget";
    try   { return await request(path); }
    catch (err) { if (isOffline(err)) return localGetBudget(params); throw err; }
  },
  save: async (body) => {
    try   { return await request("/budget", { method: "POST", body: JSON.stringify(body) }); }
    catch (err) { if (isOffline(err)) return localSaveBudget(body); throw err; }
  },
};

export const analyticsAPI = {
  get: async (params = {}) => {
    try   { return await request(`/analytics?${new URLSearchParams(params)}`); }
    catch (err) { if (isOffline(err)) return localGetExpenses(); throw err; }
  },
};

export const notificationsAPI = {
  getAll: async () => {
    try   { return await request("/notifications"); }
    catch (err) { if (isOffline(err)) return localGetNotifications(); throw err; }
  },
};
