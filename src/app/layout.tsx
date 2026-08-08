import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "✈️ ברטיסלבה & וינה | דצמבר 2026",
  description: "אתר הטיול המשפחתי — הזמנות, לו״ז, תחבורה, מסמכים ותקציב",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

