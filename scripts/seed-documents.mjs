import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tripDir = path.join(__dirname, "..", "..");

const url = "https://kyztsxgffagpuaugtsfv.supabase.co";
const anonKey = process.env.SEED_ANON_KEY;
const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

if (!anonKey || !email || !password) {
  console.error("Missing SEED_ANON_KEY / SEED_EMAIL / SEED_PASSWORD env vars");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error("auth failed:", authError.message);
  process.exit(1);
}

const files = [
  { file: "Booking.com_ Confirmation_Marrols boutique hotel.pdf", name: "אישור הזמנה — Marrol's Boutique Hotel (ברטיסלבה)", category: "hotel" },
  { file: "Booking.com_ Confirmation_boutique Hotel das Tyrol.pdf", name: "אישור הזמנה — Boutiquehotel Das Tyrol (וינה)", category: "hotel" },
  { file: "WIZZ SUMMARY.png", name: "סיכום הזמנת טיסות Wizz Air", category: "flight" },
  { file: "הסעה.png", name: "אישור העברה — JETLIMO (שדה תעופה BTS)", category: "transfer" },
];

for (const item of files) {
  const filePath = path.join(tripDir, item.file);
  if (!fs.existsSync(filePath)) {
    console.warn("skip (not found):", filePath);
    continue;
  }
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(item.file);
  const contentType = ext === ".pdf" ? "application/pdf" : "image/png";
  const storagePath = `${Date.now()}_${item.file.replace(/[^\w.\-]+/g, "_")}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, buf, { contentType });
  if (uploadError) {
    console.error("upload failed for", item.file, uploadError.message);
    continue;
  }

  const { error: insertError } = await supabase.from("documents").insert({
    name: item.name,
    category: item.category,
    storage_path: storagePath,
    size: buf.length,
    content_type: contentType,
  });
  if (insertError) {
    console.error("insert failed for", item.file, insertError.message);
    continue;
  }
  console.log("uploaded:", item.file, "->", storagePath);
}

console.log("done");
process.exit(0);
