import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { AccessGate, Card, Empty, fmtDate, kindLabel, Loading, PageTitle } from "@/components/app-ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/app/schedule")({
  head: () => pageMeta("المواعيد", "مواعيد المحاضرات والامتحانات والتكليفات."),
  component: Schedule,
});

const tabs = [["all", "الكل"], ["lecture", "محاضرات"], ["exam", "امتحانات"], ["assignment", "تكليفات"]] as const;

function Schedule() {
  const me = useMe();
  const [tab, setTab] = useState<string>("all");
  const q = useQuery({
    queryKey: ["events"],
    enabled: !!me.data?.hasAccess,
    queryFn: async () => (await supabase.from("events").select("*, subjects(name)").gte("starts_at", new Date(Date.now() - 86_400_000).toISOString()).order("starts_at").limit(200)).data ?? [],
  });
  if (me.isLoading) return <Loading />;
  if (!me.data?.hasAccess) return <AccessGate status={me.data?.status ?? "awaiting_payment"} linked={!!me.data?.tg} />;
  if (q.isLoading) return <Loading />;
  const list = (q.data ?? []).filter((e) => tab === "all" || e.kind === tab);
  return (
    <div>
      <PageTitle title="المواعيد والامتحانات" />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{l}</button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="لا توجد مواعيد قادمة" /> : (
        <div className="space-y-3">
          {list.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${e.kind === "exam" ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"}`}>{kindLabel[e.kind]}</span>
                  <p className="mt-2 font-bold">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{[(e.subjects as { name: string } | null)?.name, e.location].filter(Boolean).join(" · ")}</p>
                  {e.notes && <p className="mt-1 text-sm">{e.notes}</p>}
                </div>
                <p className="text-sm font-semibold text-navy">{fmtDate(e.starts_at, true)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
