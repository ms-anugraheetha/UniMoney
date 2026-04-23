import { query } from "./db.js";
import { id, monthWindow } from "./utils.js";

async function clearBudgetNotifications(userId) {
  await query(
    `DELETE FROM notifications
     WHERE user_id = $1
       AND notification_id IN ($2, $3, $4)`,
    [userId, `${userId}:budget-exceeded`, `${userId}:budget-warning-90`, `${userId}:budget-warning-75`]
  );
}

export async function refreshBudgetNotifications(userId) {
  await clearBudgetNotifications(userId);

  const { year, month, monthKey } = monthWindow();

  const expenseResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE user_id = $1
       AND TO_CHAR(transaction_date, 'YYYY-MM') = $2`,
    [userId, monthKey]
  );

  const budgetResult = await query(
    `SELECT * FROM budgets
     WHERE user_id = $1 AND month = $2 AND year = $3
     LIMIT 1`,
    [userId, month, year]
  );

  const budget = budgetResult.rows[0];
  const totalSpent = Number(expenseResult.rows[0]?.total || 0);

  if (!budget) return;

  const limit = Number(budget.monthly_limit);
  const pct = limit > 0 ? (totalSpent / limit) * 100 : 0;

  let payload = null;
  if (pct >= 100) {
    payload = {
      notification_id: `${userId}:budget-exceeded`,
      level: "high",
      title: "Budget exceeded",
      message: `You have spent ${totalSpent.toFixed(2)} out of ${limit.toFixed(2)} this month.`,
    };
  } else if (pct >= 90) {
    payload = {
      notification_id: `${userId}:budget-warning-90`,
      level: "medium",
      title: "Budget warning",
      message: `You have used ${pct.toFixed(0)}% of your monthly budget.`,
    };
  } else if (pct >= 75) {
    payload = {
      notification_id: `${userId}:budget-warning-75`,
      level: "low",
      title: "Budget check-in",
      message: `You have used ${pct.toFixed(0)}% of your monthly budget.`,
    };
  }

  if (!payload) return;

  await query(
    `INSERT INTO notifications (notification_id, user_id, level, title, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [payload.notification_id, userId, payload.level, payload.title, payload.message]
  );
}

export async function createWelcomeNotification(userId) {
  await query(
    `INSERT INTO notifications (notification_id, user_id, level, title, message)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (notification_id) DO NOTHING`,
    [`${userId}:welcome-start`, userId, "low", "Start tracking", "Add your first expense to begin building your spending history."]
  );
}
