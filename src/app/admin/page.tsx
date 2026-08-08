import { createClient } from "@/lib/supabase/server";
import { SEED_CONTENT } from "@/lib/seedContent";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { TripContent, ContentVersion, Expense, TripDocument } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: versions }, { data: expenseRows }, { data: documentRows }] = await Promise.all([
    supabase
      .from("trip_content_versions")
      .select("id, data, label, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("expenses").select("*").order("created_at", { ascending: true }),
    supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
  ]);

  const versionList: ContentVersion[] = (versions as ContentVersion[]) || [];
  const currentContent: TripContent = versionList[0]?.data || SEED_CONTENT;
  const expenses: Expense[] = expenseRows || [];
  const documents: TripDocument[] = documentRows || [];

  return (
    <AdminDashboard
      currentContent={currentContent}
      versions={versionList}
      expenses={expenses}
      documents={documents}
    />
  );
}
