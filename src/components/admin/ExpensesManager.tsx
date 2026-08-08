"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { Expense } from "@/lib/types";

const emptyForm = { day_label: "", title: "", category: "food", eur: "", rate: "4.05", paid: true, note: "" };

export default function ExpensesManager({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.eur) return;
    setSaving(true);
    const eur = parseFloat(form.eur);
    const rate = parseFloat(form.rate) || 4.05;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        day_label: form.day_label || null,
        title: form.title,
        category: form.category,
        eur,
        rate,
        ils: eur * rate,
        paid: form.paid,
        note: form.note || null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (!error && data) {
      setExpenses([...expenses, data as Expense]);
      setForm(emptyForm);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("למחוק את ההוצאה הזו?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) setExpenses(expenses.filter((x) => x.id !== id));
  }

  const total = expenses.reduce((s, e) => s + (e.ils || 0), 0);

  return (
    <div>
      <div className="card">
        <div className="card-title">➕ הוספת הוצאה</div>
        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div className="admin-field">
              <label>יום / תאריך</label>
              <input value={form.day_label} onChange={(e) => setForm({ ...form, day_label: e.target.value })} placeholder="למשל: יום 3 - 15/12" />
            </div>
            <div className="admin-field">
              <label>תיאור</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="admin-field">
              <label>קטגוריה</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>€ יורו</label>
              <input type="number" step="0.01" value={form.eur} onChange={(e) => setForm({ ...form, eur: e.target.value })} required />
            </div>
            <div className="admin-field">
              <label>שער ₪/€</label>
              <input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </div>
          </div>
          <button className="admin-btn" type="submit" disabled={saving}>{saving ? "שומר..." : "הוסף הוצאה"}</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">רשימת הוצאות (סה״כ {total.toLocaleString("he-IL", { minimumFractionDigits: 2 })} ₪)</div>
        <table className="budget-table">
          <thead>
            <tr><th>יום</th><th>תיאור</th><th>קטגוריה</th><th>€</th><th>₪</th><th></th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td style={{ fontSize: "0.82em", color: "#888" }}>{e.day_label}</td>
                <td>{e.title}</td>
                <td>{EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category}</td>
                <td style={{ direction: "ltr", textAlign: "left" }}>€{e.eur}</td>
                <td className="budget-ils">₪{(e.ils || 0).toLocaleString("he-IL", { minimumFractionDigits: 2 })}</td>
                <td><button className="admin-btn danger" onClick={() => handleDelete(e.id)}>מחק</button></td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={6} className="budget-empty">אין עדיין הוצאות</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
