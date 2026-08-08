"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TripContent, ContentVersion } from "@/lib/types";

const SECTIONS: { key: keyof TripContent; label: string }[] = [
  { key: "hero_html", label: "🎯 כותרת ראשית" },
  { key: "bookings_html", label: "📋 הזמנות" },
  { key: "itinerary_html", label: "📅 לו״ז" },
  { key: "transport_html", label: "🚂 תחבורה" },
  { key: "bratislava_html", label: "🏰 ברטיסלבה" },
  { key: "vienna_html", label: "🎡 וינה" },
  { key: "docs_html", label: "📁 מסמכים (טקסט)" },
  { key: "budget_fixed_html", label: "💰 תקציב קבוע" },
];

export default function ContentEditor({
  initialContent,
  initialVersions,
}: {
  initialContent: TripContent;
  initialVersions: ContentVersion[];
}) {
  const [draft, setDraft] = useState<TripContent>(initialContent);
  const [sectionKey, setSectionKey] = useState<keyof TripContent>("bookings_html");
  const [versions, setVersions] = useState<ContentVersion[]>(initialVersions);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trip_content_versions")
      .insert({ data: draft, label: `עריכה — ${SECTIONS.find((s) => s.key === sectionKey)?.label}` })
      .select("id, data, label, created_at")
      .single();
    setSaving(false);
    if (error) {
      setMessage("שגיאה בשמירה: " + error.message);
      return;
    }
    if (data) setVersions([data as ContentVersion, ...versions]);
    setMessage("✓ נשמר בהצלחה — הגרסה החדשה כבר חיה באתר");
  }

  async function handleRestore(v: ContentVersion) {
    if (!confirm(`לשחזר את הגרסה מ-${new Date(v.created_at).toLocaleString("he-IL")}?`)) return;
    setDraft(v.data);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trip_content_versions")
      .insert({ data: v.data, label: "שחזור גרסה קודמת" })
      .select("id, data, label, created_at")
      .single();
    if (!error && data) {
      setVersions([data as ContentVersion, ...versions]);
      setMessage("✓ הגרסה שוחזרה");
    }
  }

  return (
    <div>
      {message && <div className="admin-error" style={{ background: "#e8f5e9", borderColor: "#c3e6cb", color: "#1e7e34" }}>{message}</div>}

      <div className="admin-field">
        <label>איזה חלק באתר לערוך?</label>
        <select value={sectionKey} onChange={(e) => setSectionKey(e.target.value as keyof TripContent)}>
          {SECTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label>קוד HTML של הסעיף (זהירות — עריכה ישירה)</label>
        <textarea
          value={draft[sectionKey]}
          onChange={(e) => setDraft({ ...draft, [sectionKey]: e.target.value })}
          spellCheck={false}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className="admin-btn" onClick={handleSave} disabled={saving}>
          {saving ? "שומר..." : "💾 שמור גרסה חדשה"}
        </button>
        <button className="admin-btn ghost" onClick={() => setShowHistory(!showHistory)}>
          🕓 היסטוריית גרסאות ({versions.length})
        </button>
      </div>

      {showHistory && (
        <div className="card">
          <div className="card-title">היסטוריית גרסאות</div>
          {versions.length === 0 && <div>אין עדיין גרסאות שמורות.</div>}
          {versions.map((v) => (
            <div className="admin-version-row" key={v.id}>
              <span>{new Date(v.created_at).toLocaleString("he-IL")} — {v.label || "ללא תווית"}</span>
              <button className="admin-btn ghost" onClick={() => handleRestore(v)}>שחזר</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">תצוגה מקדימה</div>
        <div dangerouslySetInnerHTML={{ __html: draft[sectionKey] }} />
      </div>
    </div>
  );
}
