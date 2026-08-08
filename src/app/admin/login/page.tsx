"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("התחברות נכשלה — בדוק אימייל וסיסמה");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="admin-login-box">
      <h1 style={{ fontSize: "1.3em", fontWeight: 700, marginBottom: 20, textAlign: "center" }}>
        🔒 כניסת מנהל
      </h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-field">
          <label>אימייל</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="admin-field">
          <label>סיסמה</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="admin-btn" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "מתחבר..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}
