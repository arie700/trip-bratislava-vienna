"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_CATEGORIES } from "@/lib/types";
import type { TripDocument } from "@/lib/types";

export default function DocumentsManager({ initialDocuments }: { initialDocuments: TripDocument[] }) {
  const [documents, setDocuments] = useState<TripDocument[]>(initialDocuments);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const path = `${Date.now()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    if (uploadError) {
      setUploading(false);
      setError("שגיאה בהעלאה: " + uploadError.message);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("documents")
      .insert({
        name: name || file.name,
        category,
        storage_path: path,
        size: file.size,
        content_type: file.type,
      })
      .select("*")
      .single();

    setUploading(false);
    if (insertError) {
      setError("שגיאה בשמירת הפרטים: " + insertError.message);
      return;
    }
    if (data) {
      setDocuments([data as TripDocument, ...documents]);
      setFile(null);
      setName("");
    }
  }

  async function handleDelete(doc: TripDocument) {
    if (!confirm(`למחוק את "${doc.name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from("documents").remove([doc.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (!error) setDocuments(documents.filter((d) => d.id !== doc.id));
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">⬆️ העלאת מסמך חדש</div>
        <form onSubmit={handleUpload}>
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-field">
            <label>קובץ (PDF / תמונה)</label>
            <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
          <div className="admin-field">
            <label>שם תצוגה</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={file?.name || "לדוגמה: אישור מלון Marrol's"} />
          </div>
          <div className="admin-field">
            <label>קטגוריה</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button className="admin-btn" type="submit" disabled={uploading || !file}>
            {uploading ? "מעלה..." : "העלה מסמך"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">📎 מסמכים קיימים ({documents.length})</div>
        {documents.length === 0 && <div className="budget-empty">אין עדיין מסמכים</div>}
        {documents.map((doc) => (
          <div className="doc-item" key={doc.id}>
            <div className="doc-icon">{doc.content_type?.includes("pdf") ? "📄" : "🖼️"}</div>
            <div className="doc-info">
              <div className="doc-name">{doc.name}</div>
              <div className="doc-detail">
                {DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label} · {new Date(doc.uploaded_at).toLocaleDateString("he-IL")}
                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}
              </div>
            </div>
            <button className="admin-btn danger" onClick={() => handleDelete(doc)}>מחק</button>
          </div>
        ))}
      </div>
    </div>
  );
}
