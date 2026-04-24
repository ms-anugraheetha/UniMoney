import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { initDb, query } from "./db.js";
import { requireAuth, signToken } from "./auth.js";
import { createWelcomeNotification, refreshBudgetNotifications } from "./notifications.js";
import { id, monthWindow, publicUser } from "./utils.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, username, password } = req.body || {};

  if (!fullName || !email || !username || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedUsername = String(username).trim();

  try {
    const existing = await query(
      `SELECT user_id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
      [normalizedEmail, normalizedUsername]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: "Email or username already exists." });
    }

    const user = {
      user_id: id(),
      full_name: String(fullName).trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      password_hash: await bcrypt.hash(String(password), 10),
    };

    const result = await query(
      `INSERT INTO users (user_id, full_name, email, username, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, username, created_at`,
      [user.user_id, user.full_name, user.email, user.username, user.password_hash]
    );

    await createWelcomeNotification(user.user_id);

    const safeUser = publicUser(result.rows[0]);
    res.status(201).json({ user: safeUser, token: signToken(safeUser) });
  } catch (error) {
    res.status(500).json({ message: "Failed to register user." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifier and password are required." });
  }

  try {
    const lookup = String(identifier).trim().toLowerCase();
    const result = await query(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
      [lookup]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: "Incorrect email/username or password." });
    }

    const match = await bcrypt.compare(String(password), user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect email/username or password." });
    }

    const safeUser = publicUser(user);
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch {
    res.status(500).json({ message: "Failed to sign in." });
  }
});

app.post("/api/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required." });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  try {
    const result = await query(`SELECT * FROM users WHERE user_id = $1 LIMIT 1`, [req.user.user_id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const match = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [passwordHash, req.user.user_id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to update password." });
  }
});

app.get("/api/expenses", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT expense_id, user_id, title, amount, category, transaction_date, description, created_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY transaction_date DESC, created_at DESC`,
      [req.user.user_id]
    );
    res.json({ expenses: result.rows });
  } catch {
    res.status(500).json({ message: "Failed to fetch expenses." });
  }
});

app.post("/api/expenses", requireAuth, async (req, res) => {
  const { title, amount, category, transaction_date, description = "" } = req.body || {};

  if (!title || !amount || !category || !transaction_date) {
    return res.status(400).json({ message: "Title, amount, category, and date are required." });
  }

  try {
    const result = await query(
      `INSERT INTO expenses (expense_id, user_id, title, amount, category, transaction_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING expense_id, user_id, title, amount, category, transaction_date, description, created_at`,
      [id(), req.user.user_id, String(title).trim(), Number(amount), String(category), transaction_date, String(description)]
    );
    await refreshBudgetNotifications(req.user.user_id);
    res.status(201).json({ expense: result.rows[0] });
  } catch {
    res.status(500).json({ message: "Failed to create expense." });
  }
});

app.put("/api/expenses/:id", requireAuth, async (req, res) => {
  const { title, amount, category, transaction_date, description = "" } = req.body || {};

  try {
    const result = await query(
      `UPDATE expenses
       SET title = $1, amount = $2, category = $3, transaction_date = $4, description = $5
       WHERE expense_id = $6 AND user_id = $7
       RETURNING expense_id, user_id, title, amount, category, transaction_date, description, created_at`,
      [String(title).trim(), Number(amount), String(category), transaction_date, String(description), req.params.id, req.user.user_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Expense not found." });
    }

    await refreshBudgetNotifications(req.user.user_id);
    res.json({ expense: result.rows[0] });
  } catch {
    res.status(500).json({ message: "Failed to update expense." });
  }
});

app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM expenses WHERE expense_id = $1 AND user_id = $2 RETURNING expense_id`,
      [req.params.id, req.user.user_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Expense not found." });
    }
    await refreshBudgetNotifications(req.user.user_id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete expense." });
  }
});

app.get("/api/budget", requireAuth, async (req, res) => {
  const current = monthWindow();
  const year = Number(req.query.year || current.year);
  const month = Number(req.query.month || current.month);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: "Valid month and year are required." });
  }

  try {
    const result = await query(
      `SELECT * FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3 LIMIT 1`,
      [req.user.user_id, month, year]
    );
    res.json({ budget: result.rows[0] || null });
  } catch {
    res.status(500).json({ message: "Failed to fetch budget." });
  }
});

app.post("/api/budget", requireAuth, async (req, res) => {
  const { month, year, monthly_limit } = req.body || {};
  if (!month || !year || !monthly_limit) {
    return res.status(400).json({ message: "Month, year, and monthly limit are required." });
  }

  try {
    const result = await query(
      `INSERT INTO budgets (budget_id, user_id, monthly_limit, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, month, year)
       DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, updated_at = NOW()
       RETURNING *`,
      [id(), req.user.user_id, Number(monthly_limit), Number(month), Number(year)]
    );
    await refreshBudgetNotifications(req.user.user_id);
    res.json({ budget: result.rows[0] });
  } catch {
    res.status(500).json({ message: "Failed to save budget." });
  }
});

app.get("/api/analytics", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT expense_id, user_id, title, amount, category, transaction_date, description, created_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY transaction_date DESC, created_at DESC`,
      [req.user.user_id]
    );
    res.json({ expenses: result.rows });
  } catch {
    res.status(500).json({ message: "Failed to fetch analytics." });
  }
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    await refreshBudgetNotifications(req.user.user_id);
    const result = await query(
      `SELECT notification_id, level, title, message, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.user_id]
    );
    res.json({ notifications: result.rows });
  } catch {
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`UniMoney API listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
