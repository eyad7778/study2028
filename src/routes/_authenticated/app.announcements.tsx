import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { AccessGate, Card, Empty, fmtDate, Loading, PageTitle } from "@/components/app-ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/app/announcements")({
  head: () => pageMeta("الإعلانات", "آخر إعلانات الإدارة والدفعة."),
  component: Announcements,
});

function Announcements() {
  const me = useMe();
  const q = useQuery({
    queryKey: ["announcements"],
    enabled: !!me.data?.hasAccess,
    queryFn: async () => (await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(100)).data ?? [],
  });
  if (me.isLoading) return <Loading />;
  if (!me.data?.hasAccess) return <AccessGate status={me.data?.status ?? "awaiting_payment"} linked={!!me.data?.tg} />;
  if (q.isLoading) return <Loading />;
  return (
    <div>
      <PageTitle title="الإعلانات" />
      {(q.data ?? []).length === 0 ? <Empty title="لا توجد إعلانات" /> : (
        <div className="space-y-3">
          {q.data!.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-primary" : ""}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {a.pinned && <Pin className="size-3.5 text-primary" />}
                <span className="rounded-full bg-muted px-2 py-0.5">{a.category}</span>
                <span>{fmtDate(a.published_at)}</span>
              </div>
              <h2 className="mt-2 font-bold">{a.title}</h2>
              <p className="mt-1 whitespace-pre-line text-sm leading-7">{a.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
