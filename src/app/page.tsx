import { createClient } from "@/lib/supabase/server";
import { SEED_CONTENT } from "@/lib/seedContent";
import TripSite from "@/components/TripSite";
import type { TripContent, Expense, TripDocument } from "@/lib/types";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  const [{ data: versionRow }, { data: expenseRows }, { data: documentRows }] = await Promise.all([
    supabase
      .from("trip_content_versions")
      .select("data")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("expenses").select("*").order("created_at", { ascending: true }),
    supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
  ]);

  const content: TripContent = (versionRow?.data as TripContent) || SEED_CONTENT;
  const expenses: Expense[] = expenseRows || [];
  const documents: TripDocument[] = documentRows || [];

  const documentsBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents`;

  return (
    <TripSite
      content={content}
      expenses={expenses}
      documents={documents}
      documentsBaseUrl={documentsBaseUrl}
    />
  );
}
