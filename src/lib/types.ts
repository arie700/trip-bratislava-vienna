export type TripContent = {
  hero_html: string;
  bookings_html: string;
  transport_html: string;
  itinerary_html: string;
  bratislava_html: string;
  vienna_html: string;
  docs_html: string;
  budget_fixed_html: string;
};

export type ContentVersion = {
  id: number;
  data: TripContent;
  label: string | null;
  created_at: string;
};

export type Expense = {
  id: number;
  day_label: string | null;
  title: string;
  category: string;
  eur: number | null;
  rate: number | null;
  ils: number | null;
  paid: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TripDocument = {
  id: number;
  name: string;
  category: string;
  storage_path: string;
  size: number | null;
  content_type: string | null;
  uploaded_at: string;
};

export const EXPENSE_CATEGORIES: { value: string; label: string; cls: string }[] = [
  { value: "flight", label: "✈️ טיסות", cls: "cat-flight" },
  { value: "hotel", label: "🏨 מלון", cls: "cat-hotel" },
  { value: "transport", label: "🚂 תחבורה", cls: "cat-transport" },
  { value: "food", label: "🍽️ אוכל/קפה", cls: "cat-food" },
  { value: "sight", label: "🏛️ אטרקציה", cls: "cat-sight" },
  { value: "market", label: "🎄 שוק חג", cls: "cat-market" },
  { value: "other", label: "📦 אחר", cls: "cat-other" },
];

export const DOCUMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: "flight", label: "✈️ טיסה" },
  { value: "hotel", label: "🏨 מלון" },
  { value: "transfer", label: "🚗 העברה" },
  { value: "insurance", label: "💊 ביטוח" },
  { value: "other", label: "📄 אחר" },
];
