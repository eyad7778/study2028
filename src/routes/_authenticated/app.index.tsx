import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarClock, ChevronLeft, CreditCard, Megaphone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, useMe } from "@/hooks/use-me";
import { AccessGate, Card, ErrorBox, fmtDate, kindLabel, Loading } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "لوحتي — Smart Campus" },
      { name: "description", content: "ملخص حسابك واشتراكك ومحتواك الدراسي." },
      { property: "og:title", content: "لوحتي — Smart Campus" },
      { property: "og:description", content: "ملخص سريع لكل ما يخص دراستك." },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const me = useMe();
  const feed = useQuery({
    queryKey: ["home-feed"],
    enabled: !!me.data?.hasAccess,
    queryFn: async () => {
      const [a, e, s] = await Promise.all([
        supabase.from("announcements").select("id, title, category, published_at").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3),
        supabase.from("events").select("id, title, kind, starts_at").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
      ]);
      return { ann: a.data ?? [], events: e.data ?? [], subjects: s.count ?? 0 };
    },
  });

  if (me.isLoading) return <Loading />;
  if (!me.data) return <ErrorBox />;
  const { profile, sub, status, tg, hasAccess } = me.data;
  const st = statusLabel[status];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">مرحبًا 👋</p>
        <h1 className="text-2xl font-bold">{profile?.full_name || "طالب"}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/app/subscription">
          <Card className="h-full transition hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><CreditCard className="size-5 text-primary" /> الاشتراك</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.text}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {status === "active" ? `ينتهي في ${fmtDate(sub?.end_at)}` : status === "pending" ? "طلبك قيد المراجعة من الإدارة." : "اضغط لعرض طرق الدفع وتفعيل اشتراكك."}
            </p>
          </Card>
        </Link>
        <Link to="/app/telegram">
          <Card className="h-full transition hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><Send className="size-5 text-primary" /> Telegram</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tg ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{tg ? "مرتبط" : "غير مرتبط"}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{tg ? `منذ ${fmtDate(tg.linked_at)}` : "الربط مطلوب بعد التفعيل لتصلك الإشعارات."}</p>
          </Card>
        </Link>
      </div>

      {!hasAccess ? (
        <AccessGate status={status} linked={!!tg} />
      ) : feed.isLoading ? <Loading /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: "/app/subjects", icon: BookOpen, label: "المواد", v: feed.data?.subjects },
              { to: "/app/announcements", icon: Megaphone, label: "الإعلانات", v: feed.data?.ann.length },
              { to: "/app/schedule", icon: CalendarClock, label: "المواعيد", v: feed.data?.events.length },
            ].map((x) => (
              <Link key={x.to} to={x.to} className="rounded-2xl border bg-card p-4 text-center shadow-card hover:border-primary">
                <x.icon className="mx-auto size-6 text-primary" />
                <p className="mt-2 text-sm font-semibold">{x.label}</p>
              </Link>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">آخر الإعلانات</h2>
                <Link to="/app/announcements" className="flex items-center text-xs text-primary">الكل <ChevronLeft className="size-4" /></Link>
              </div>
              <ul className="mt-3 divide-y">
                {feed.data?.ann.length === 0 && <li className="py-3 text-sm text-muted-foreground">لا توجد إعلانات.</li>}
                {feed.data?.ann.map((a) => <li key={a.id} className="py-3 text-sm"><b>{a.title}</b><span className="block text-xs text-muted-foreground">{a.category} · {fmtDate(a.published_at)}</span></li>)}
              </ul>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">أقرب المواعيد</h2>
                <Link to="/app/schedule" className="flex items-center text-xs text-primary">الكل <ChevronLeft className="size-4" /></Link>
              </div>
              <ul className="mt-3 divide-y">
                {feed.data?.events.length === 0 && <li className="py-3 text-sm text-muted-foreground">لا توجد مواعيد قادمة.</li>}
                {feed.data?.events.map((e) => <li key={e.id} className="flex justify-between gap-2 py-3 text-sm"><span><b>{e.title}</b><span className="block text-xs text-muted-foreground">{kindLabel[e.kind]}</span></span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(e.starts_at, true)}</span></li>)}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
