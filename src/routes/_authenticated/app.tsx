import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarClock,
  Home,
  LogOut,
  Megaphone,
  Shield,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "الرئيسية", icon: Home, exact: true },
  { to: "/app/subjects", label: "المواد", icon: BookOpen },
  { to: "/app/announcements", label: "الإعلانات", icon: Megaphone },
  { to: "/app/schedule", label: "المواعيد", icon: CalendarClock },
  { to: "/app/notifications", label: "الإشعارات", icon: Bell },
  { to: "/app/subscription", label: "حسابي", icon: UserRound },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const me = useMe();
  const unread = useQuery({
    queryKey: ["unread", me.data?.id],
    enabled: !!me.data,
    queryFn: async () => {
      const [n, r] = await Promise.all([
        supabase
          .from("notifications")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("notification_reads").select("notification_id"),
      ]);
      const read = new Set((r.data ?? []).map((x) => x.notification_id));
      return (n.data ?? []).filter((x) => !read.has(x.id)).length;
    },
  });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            {me.data?.profile?.full_name && (
              <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
                {me.data.profile.full_name}
              </span>
            )}
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n }}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                activeProps={{ className: "bg-primary-soft font-semibold text-accent-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {me.data?.isStaff && (
              <Button variant="ghost" size="icon" asChild aria-label="الإدارة">
                <Link to="/admin">
                  <Shield className="size-5" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild aria-label="الإشعارات">
              <Link to="/app/notifications" className="relative">
                <Bell className="size-5" />
                {!!unread.data && (
                  <span className="absolute -top-0.5 -end-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] text-primary-foreground">
                    {unread.data}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label="Telegram">
              <Link to="/app/telegram">
                <Megaphone className="size-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="تسجيل الخروج" onClick={logout}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: "exact" in n }}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
