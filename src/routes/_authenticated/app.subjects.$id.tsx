import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { AccessGate, Card, Empty, ErrorBox, fmtDate, kindLabel, Loading, PageTitle } from "@/components/app-ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/app/subjects/$id")({
  head: () => pageMeta("محاضرات المادة", "محاضرات وملفات ومواعيد المادة."),
  component: SubjectPage,
});

export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from("lectures").createSignedUrl(path, 300);
  if (error || !data) return toast.error("تعذّر فتح الملف");
  window.open(data.signedUrl, "_blank", "noopener");
}

function SubjectPage() {
  const { id } = Route.useParams();
  const me = useMe();
  const q = useQuery({
    queryKey: ["subject", id],
    enabled: !!me.data?.hasAccess,
    queryFn: async () => {
      const [s, l, e] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
        supabase.from("lectures").select("*").eq("subject_id", id).order("week", { nullsFirst: false }).order("created_at"),
        supabase.from("events").select("*").eq("subject_id", id).gte("starts_at", new Date().toISOString()).order("starts_at"),
      ]);
      return { subject: s.data, lectures: l.data ?? [], events: e.data ?? [] };
    },
  });
  if (me.isLoading) return <Loading />;
  if (!me.data?.hasAccess) return <AccessGate status={me.data?.status ?? "awaiting_payment"} linked={!!me.data?.tg} />;
  if (q.isLoading) return <Loading />;
  if (!q.data?.subject) return <ErrorBox text="المادة غير موجودة." />;
  const { subject, lectures, events } = q.data;
  return (
    <div>
      <Link to="/app/subjects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowRight className="size-4" /> كل المواد</Link>
      <PageTitle title={subject.name} subtitle={subject.description ?? undefined} />
      {events.length > 0 && (
        <Card className="mb-4">
          <h2 className="font-bold">مواعيد قادمة</h2>
          <ul className="mt-2 space-y-1 text-sm">{events.map((e) => <li key={e.id}>{kindLabel[e.kind]}: {e.title} · {fmtDate(e.starts_at, true)}</li>)}</ul>
        </Card>
      )}
      {lectures.length === 0 ? <Empty title="لا توجد محاضرات بعد" /> : (
        <div className="space-y-3">
          {lectures.map((l) => (
            <Card key={l.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{l.week ? `الأسبوع ${l.week} · ` : ""}{l.title}</p>
                  {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
                </div>
                <div className="flex gap-2">
                  {l.file_path && <Button size="sm" onClick={() => openFile(l.file_path!)}><FileDown className="size-4" /> الملف</Button>}
                  {l.external_url && <Button size="sm" variant="outline" asChild><a href={l.external_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> رابط</a></Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
