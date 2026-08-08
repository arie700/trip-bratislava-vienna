"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { TripContent, Expense, TripDocument } from "@/lib/types";
import { DOCUMENT_CATEGORIES } from "@/lib/types";

const TABS = [
  { key: "bookings", label: "📋 הזמנות" },
  { key: "itinerary", label: "📅 לו״ז" },
  { key: "transport", label: "🚂 תחבורה" },
  { key: "bratislava", label: "🏰 ברטיסלבה" },
  { key: "vienna", label: "🎡 וינה" },
  { key: "docs", label: "📁 מסמכים" },
  { key: "budget", label: "💰 תקציב" },
];

const WMO: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 77: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "⛈️",
  85: "🌨️", 86: "❄️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const DEFAULT_RATE = 4.05;

function formatILS(num: number) {
  if (!num || isNaN(num)) return "—";
  return "₪" + num.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatEUR(num: number) {
  if (!num || isNaN(num)) return "—";
  return "€" + num.toFixed(2);
}

async function fetchWeather(lat: number, lon: number, elId: string, cityName: string) {
  const el = document.getElementById(elId);
  if (!el) return;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto&forecast_days=2`;
    const res = await fetch(url);
    const d = await res.json();
    const cw = d.current_weather;
    const todayMax = Math.round(d.daily.temperature_2m_max[0]);
    const todayMin = Math.round(d.daily.temperature_2m_min[0]);
    const tmrMax = Math.round(d.daily.temperature_2m_max[1]);
    const tmrMin = Math.round(d.daily.temperature_2m_min[1]);
    const nowIcon = WMO[cw.weathercode] || "🌡️";
    const todayIcon = WMO[d.daily.weathercode[0]] || "🌡️";
    const tmrIcon = WMO[d.daily.weathercode[1]] || "🌡️";
    el.innerHTML = `
      <div class="weather-icon-big">${nowIcon}</div>
      <div>
        <div class="weather-city-name">${cityName}</div>
        <div class="weather-days">
          <div class="weather-day"><div class="weather-day-label">היום</div><div class="weather-day-icon">${todayIcon}</div><div class="weather-day-range">${todayMax}° / ${todayMin}°</div></div>
          <div class="weather-day"><div class="weather-day-label">מחר</div><div class="weather-day-icon">${tmrIcon}</div><div class="weather-day-range">${tmrMax}° / ${tmrMin}°</div></div>
        </div>
        <div class="weather-now">עכשיו: ${Math.round(cw.temperature)}°C</div>
      </div>`;
  } catch {
    el.innerHTML = `<div class="weather-icon-big">🌡️</div><div><div class="weather-city-name">${cityName}</div><div class="weather-error">מזג האוויר אינו זמין</div></div>`;
  }
}

export default function TripSite({
  content,
  expenses,
  documents,
  documentsBaseUrl,
}: {
  content: TripContent;
  expenses: Expense[];
  documents: TripDocument[];
  documentsBaseUrl: string;
}) {
  const [activeTab, setActiveTab] = useState("bookings");
  const itineraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function toggleDay(header: HTMLElement) {
      const body = header.nextElementSibling as HTMLElement | null;
      const toggle = header.querySelector(".day-toggle");
      if (!body) return;
      const isOpen = body.classList.toggle("open");
      toggle?.classList.toggle("open", isOpen);
    }
    function togglePlanB(btn: HTMLButtonElement) {
      const panel = btn.nextElementSibling as HTMLElement | null;
      if (!panel) return;
      const open = panel.classList.toggle("open");
      btn.textContent = open ? "❌ סגור Plan B" : "🌧️ Plan B — מה עושים אם גשם/שלג קיצוני?";
    }

    function getPaidTotal() {
      const rateEl = document.getElementById("pre_flights_rate") as HTMLInputElement | null;
      const rate = parseFloat(rateEl?.value || "") || DEFAULT_RATE;
      return 83.15 + 457.15 * rate;
    }
    function getCommittedTotal() {
      const marrolRate = parseFloat((document.getElementById("pre_marrol_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const tyrolRate = parseFloat((document.getElementById("pre_tyrol_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const trainEur = parseFloat((document.getElementById("pre_train_eur") as HTMLInputElement)?.value) || 0;
      const trainRate = parseFloat((document.getElementById("pre_train_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      return 296.6 * marrolRate + 949.68 * tyrolRate + trainEur * trainRate;
    }
    function getTripTotal() {
      return expenses.reduce((s, e) => s + (e.ils || 0), 0);
    }
    function updateKPIs() {
      const paid = getPaidTotal();
      const committed = getCommittedTotal();
      const trip = getTripTotal();
      const total = paid + committed + trip;
      const set = (id: string, val: string) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      set("kpi-paid", formatILS(paid));
      set("kpi-committed", formatILS(committed));
      set("kpi-trip", trip > 0 ? formatILS(trip) : "₪—");
      set("kpi-total", formatILS(total));
      set("paid-total", formatILS(paid));
      set("committed-total", formatILS(committed));
    }
    function calcFlightsILS() {
      const rate = parseFloat((document.getElementById("pre_flights_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const el = document.getElementById("pre_flights_ils");
      if (el) el.textContent = formatILS(457.15 * rate);
      updateKPIs();
    }
    function calcCommittedILS() {
      const marrolRate = parseFloat((document.getElementById("pre_marrol_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const marrolEl = document.getElementById("pre_marrol_ils");
      if (marrolEl) marrolEl.textContent = formatILS(296.6 * marrolRate);

      const tyrolRate = parseFloat((document.getElementById("pre_tyrol_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const tyrolEl = document.getElementById("pre_tyrol_ils");
      if (tyrolEl) tyrolEl.textContent = formatILS(949.68 * tyrolRate);

      const trainEur = parseFloat((document.getElementById("pre_train_eur") as HTMLInputElement)?.value) || 0;
      const trainRate = parseFloat((document.getElementById("pre_train_rate") as HTMLInputElement)?.value) || DEFAULT_RATE;
      const trainEl = document.getElementById("pre_train_ils");
      if (trainEl) trainEl.textContent = trainEur > 0 ? formatILS(trainEur * trainRate) : "—";

      updateKPIs();
    }

    function exportBudgetExcel() {
      // @ts-expect-error XLSX is loaded globally from CDN
      if (typeof XLSX === "undefined") {
        alert("ספריית Excel לא נטענה. אנא בדוק חיבור לאינטרנט.");
        return;
      }
      const rows: Record<string, string | number>[] = [];
      rows.push({ קטגוריה: "✅ שולם כבר", תיאור: "טיסות + JETLIMO", תאריך: "", "יורו €": "", שער: "", "שקלים ₪": getPaidTotal() });
      rows.push({ קטגוריה: "🏨 לשלם בטיול", תיאור: "מלונות + תחבורה", תאריך: "", "יורו €": "", שער: "", "שקלים ₪": getCommittedTotal() });
      expenses.forEach((e) => {
        rows.push({
          קטגוריה: e.category,
          תיאור: e.title,
          תאריך: e.day_label || "",
          "יורו €": e.eur || "",
          שער: e.rate || "",
          "שקלים ₪": e.ils || "",
        });
      });
      rows.push({ קטגוריה: "🔢 סה״כ", תיאור: "הכל כולל הכל", תאריך: "", "יורו €": "", שער: "", "שקלים ₪": getPaidTotal() + getCommittedTotal() + getTripTotal() });
      // @ts-expect-error XLSX global
      const ws = XLSX.utils.json_to_sheet(rows);
      // @ts-expect-error XLSX global
      const wb = XLSX.utils.book_new();
      // @ts-expect-error XLSX global
      XLSX.utils.book_append_sheet(wb, ws, "תקציב טיול");
      // @ts-expect-error XLSX global
      XLSX.writeFile(wb, "תקציב_ברטיסלבה_וינה_2026.xlsx");
    }

    // expose for inline onclick="" handlers embedded in the admin-edited HTML content
    Object.assign(window, {
      toggleDay,
      togglePlanB,
      calcFlightsILS,
      calcCommittedILS,
      exportBudgetExcel,
    });

    fetchWeather(48.1486, 17.1077, "weather-brat", "🏰 ברטיסלבה");
    fetchWeather(48.2082, 16.3738, "weather-vien", "🎡 וינה");
    calcFlightsILS();
    calcCommittedILS();
  }, [expenses]);

  useEffect(() => {
    if (activeTab !== "itinerary" || !itineraryRef.current) return;
    const firstHeader = itineraryRef.current.querySelector<HTMLElement>(".day-header");
    const body = firstHeader?.nextElementSibling as HTMLElement | null;
    if (firstHeader && body && !body.classList.contains("open")) {
      body.classList.add("open");
      firstHeader.querySelector(".day-toggle")?.classList.add("open");
    }
  }, [activeTab]);

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="afterInteractive" />

      <div className="hero" dangerouslySetInnerHTML={{ __html: content.hero_html }} />

      <div id="weather-bar" className="weather-bar">
        <div className="weather-city" id="weather-brat">
          <div className="weather-icon-big">🌡️</div>
          <div>
            <div className="weather-city-name">🏰 ברטיסלבה</div>
            <div className="weather-loading">טוען מזג אוויר...</div>
          </div>
        </div>
        <div className="weather-city" id="weather-vien">
          <div className="weather-icon-big">🌡️</div>
          <div>
            <div className="weather-city-name">🎡 וינה</div>
            <div className="weather-loading">טוען מזג אוויר...</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`section container ${activeTab === "bookings" ? "active" : ""}`}
        dangerouslySetInnerHTML={{ __html: content.bookings_html }} />

      <div className={`section container ${activeTab === "itinerary" ? "active" : ""}`} ref={itineraryRef}
        dangerouslySetInnerHTML={{ __html: content.itinerary_html }} />

      <div className={`section container ${activeTab === "transport" ? "active" : ""}`}
        dangerouslySetInnerHTML={{ __html: content.transport_html }} />

      <div className={`section container ${activeTab === "bratislava" ? "active" : ""}`}
        dangerouslySetInnerHTML={{ __html: content.bratislava_html }} />

      <div className={`section container ${activeTab === "vienna" ? "active" : ""}`}
        dangerouslySetInnerHTML={{ __html: content.vienna_html }} />

      <div className={`section container ${activeTab === "docs" ? "active" : ""}`}>
        <div dangerouslySetInnerHTML={{ __html: content.docs_html }} />
        <div className="card">
          <div className="card-title">📎 מסמכים שהועלו</div>
          {documents.length === 0 ? (
            <div className="budget-empty">עדיין לא הועלו מסמכים. אריה יכול להעלות אישורי הזמנה, סריקות ועוד דרך מסך הניהול.</div>
          ) : (
            documents.map((doc) => {
              const catLabel = DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category;
              return (
                <div className="doc-item" key={doc.id}>
                  <div className="doc-icon">{doc.content_type?.includes("pdf") ? "📄" : "🖼️"}</div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-detail">{catLabel} · {new Date(doc.uploaded_at).toLocaleDateString("he-IL")}</div>
                  </div>
                  <a className="map-link" href={`${documentsBaseUrl}/${doc.storage_path}`} target="_blank" rel="noreferrer">
                    פתח ⬈
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={`section container ${activeTab === "budget" ? "active" : ""}`}>
        <div id="budget-kpis" className="budget-summary-bar">
          <div className="budget-kpi paid">
            <div className="budget-kpi-label">✅ שולם כבר</div>
            <div className="budget-kpi-value" id="kpi-paid">₪—</div>
          </div>
          <div className="budget-kpi" style={{ borderTop: "4px solid #e67e22" }}>
            <div className="budget-kpi-label">🏨 לשלם בטיול</div>
            <div className="budget-kpi-value" id="kpi-committed">₪—</div>
          </div>
          <div className="budget-kpi trip">
            <div className="budget-kpi-label">🗺️ הוצאות בטיול</div>
            <div className="budget-kpi-value" id="kpi-trip">₪—</div>
          </div>
          <div className="budget-kpi total">
            <div className="budget-kpi-label">🔢 סה״כ צפוי</div>
            <div className="budget-kpi-value" id="kpi-total">₪—</div>
          </div>
        </div>

        <div dangerouslySetInnerHTML={{ __html: content.budget_fixed_html }} />

        <div className="card">
          <div className="budget-section-title">🗺️ הוצאות בטיול (מנוהל ע״י אריה במסך הניהול)</div>
          <table className="budget-table">
            <thead>
              <tr>
                <th>יום</th><th>פעילות</th><th>קטגוריה</th>
                <th style={{ textAlign: "left", direction: "ltr" }}>€ יורו</th>
                <th style={{ textAlign: "left", direction: "ltr" }}>שער</th>
                <th>₪ שקלים</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr className="no-data"><td colSpan={6} className="budget-empty">אין עדיין הוצאות רשומות</td></tr>
              ) : (
                <>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: "0.82em", color: "#888" }}>{e.day_label}</td>
                      <td>{e.title}</td>
                      <td><span className={`budget-cat cat-${e.category}`}>{e.category}</span></td>
                      <td style={{ direction: "ltr", textAlign: "left" }}>{formatEUR(e.eur || 0)}</td>
                      <td style={{ direction: "ltr", textAlign: "left", color: "#888", fontSize: "0.82em" }}>{e.rate}</td>
                      <td className="budget-ils">{formatILS(e.ils || 0)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={5}><strong>סה״כ הוצאות בטיול</strong></td>
                    <td className="budget-ils">{formatILS(expenses.reduce((s, e) => s + (e.ils || 0), 0))}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button className="export-btn" onClick={() => (window as unknown as { exportBudgetExcel: () => void }).exportBudgetExcel()}>
            📥 ייצא לאקסל (.xlsx)
          </button>
        </div>
      </div>
    </>
  );
}
