import { randomUUID } from "node:crypto";

export function id() {
  return randomUUID();
}

export function monthWindow(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return { year, month, monthKey };
}

export function publicUser(row) {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    username: row.username,
    created_at: row.created_at,
  };
}
