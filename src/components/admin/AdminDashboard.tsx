"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ContentEditor from "./ContentEditor";
import ExpensesManager from "./ExpensesManager";
import DocumentsManager from "./DocumentsManager";
import type { TripContent, ContentVersion, Expense, TripDocument } from "@/lib/types";

const TABS = [
  { key: "content", label: "📝 תוכן האתר" },
  { key: "expenses", label: "💰 הוצאות" },
  { key: "documents", label: "📎 מסמכים" },
];

export default function AdminDashboard({
  currentContent,
  versions,
  expenses,
  documents,
}: {
  currentContent: TripContent;
  versions: ContentVersion[];
  expenses: Expense[];
  documents: TripDocument[];
}) {
  const [tab, setTab] = useState("content");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <div className="admin-topbar">
        <strong>🔧 ניהול אתר הטיול</strong>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Link href="/" target="_blank">👀 צפייה באתר</Link>
          <button className="admin-btn ghost" style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }} onClick={handleLogout}>
            יציאה
          </button>
        </div>
      </div>
      <div className="admin-shell">
        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-tab-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "content" && <ContentEditor initialContent={currentContent} initialVersions={versions} />}
        {tab === "expenses" && <ExpensesManager initialExpenses={expenses} />}
        {tab === "documents" && <DocumentsManager initialDocuments={documents} />}
      </div>
    </>
  );
}
