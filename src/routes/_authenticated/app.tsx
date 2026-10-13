import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CreditCard, Loader2, LogOut, Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "لوحتي — Smart Campus" },
      { name: "description", content: "لوحة الطالب في Smart Campus." },
      { property: "og:title", content: "لوحتي — Smart Campus" },
      { property: "og:description", content: "ملخص حسابك واشتراكك ومحتواك الدراسي." },
    ],
  }),
  component: StudentHome,
});

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending: { text: "قيد المراجعة", cls: "bg-warning-soft text-warning" },
  awaiting_payment: { text: "بانتظار الدفع", cls: "bg-warning-soft text-warning" },
  active: { text: "مفعّل", cls: "bg-success-soft text-success" },
  expired: { text: "منتهي", cls: "bg-destructive/10 text-destructive" },
  suspended: { text: "موقوف", cls: "bg-destructive/10 text-destructive" },
  rejected: { text: "مرفوض", cls: "bg-destructive/10 text-destructive" },
};

function StudentHome() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const q = useQuery({
    queryKey: ["me", user.id],
    queryFn: async () => {
      const [p, s, t, r, a, e] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status, end_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("telegram_links").select("linked_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("announcements").select("id, title, category, published_at").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3),
        supabase.from("events").select("id, title, kind, starts_at").gte("starts_at", new Date().toISOString()).order("starts_at").limit(3),
      ]);
      return { profile: p.data, sub: s.data, tg: t.data, roles: (r.data ?? []).map((x) => x.role), ann: a.data ?? [], events: e.data ?? [] };
    },
  });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (q.isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (q.error || !q.data) return <div className="grid min-h-screen place-items-center text-destructive">تعذّر تحميل بياناتك. أعد تحميل الصفحة.</div>;

  const { profile, sub, tg, roles, ann, events } = q.data;
  const st = statusLabel[sub?.status ?? "awaiting_payment"];
  const isStaff = roles.includes("owner") || roles.includes("staff");
  const active = sub?.status === "active";

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <Button variant="ghost" size="sm" onClick={logout}><LogOut className="size-4" /> خروج</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <p className="text-sm text-muted-foreground">مرحبًا</p>
          <h1 className="text-2xl font-bold">{profile?.full_name || "طالب"}</h1>
          {isStaff && <span className="mt-2 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">{roles.includes("owner") ? "مالك المنصة" : "موظف"}</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><CreditCard className="size-5 text-primary" /> الاشتراك</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.text}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {active && sub?.end_at ? `ينتهي في ${new Date(sub.end_at).toLocaleDateString("ar-EG")}` : "صفحة الدفع وإرسال الإيصال ستتوفر في المرحلة القادمة."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <span className="flex items-center gap-2 font-bold"><Send className="size-5 text-primary" /> Telegram</span>
            <p className="mt-3 text-sm text-muted-foreground">
              {tg ? `مرتبط منذ ${new Date(tg.linked_at).toLocaleDateString("ar-EG")}` : "غير مرتبط بعد. الربط مطلوب بعد تفعيل الاشتراك."}
            </p>
          </div>
        </div>

        {(active && tg) || isStaff ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-bold"><Megaphone className="size-5 text-primary" /> آخر الإعلانات</h2>
              <ul className="mt-3 divide-y">
                {ann.length === 0 && <li className="py-3 text-sm text-muted-foreground">لا توجد إعلانات.</li>}
                {ann.map((a) => <li key={a.id} className="py-3 text-sm"><b>{a.title}</b> <span className="text-muted-foreground">· {a.category}</span></li>)}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-bold"><CalendarClock className="size-5 text-primary" /> أقرب المواعيد</h2>
              <ul className="mt-3 divide-y">
                {events.length === 0 && <li className="py-3 text-sm text-muted-foreground">لا توجد مواعيد قادمة.</li>}
                {events.map((e) => <li key={e.id} className="flex justify-between py-3 text-sm"><b>{e.title}</b><span className="text-muted-foreground">{new Date(e.starts_at).toLocaleDateString("ar-EG")}</span></li>)}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
            <h2 className="font-bold">المحتوى الدراسي مغلق حاليًا</h2>
            <p className="mt-2 text-sm text-muted-foreground">يُفتح بعد تفعيل الاشتراك وربط حساب Telegram.</p>
          </div>
        )}
      </main>
    </div>
  );
}
