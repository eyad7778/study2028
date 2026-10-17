import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChevronLeft,
  CircleAlert,
  ExternalLink,
  FileText,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, useMe } from "@/hooks/use-me";
import { AccessGate, Card, ErrorBox, fmtDate, kindLabel, Loading } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "لوحتي — Smart Campus" },
      { name: "description", content: "ملخص حسابك ومحتواك الدراسي." },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const me = useMe();
  const queryClient = useQueryClient();
  const userId = me.data?.id;
  const hasAccess = me.data?.hasAccess;
  const departmentId = me.data?.profile?.department_id;
  const feed = useQuery({
    queryKey: ["home-feed", userId],
    enabled: !!hasAccess && !!userId,
    queryFn: async () => {
      const [
        announcements,
        events,
        subjects,
        notifications,
        notificationReads,
        announcementReads,
        resourceRows,
      ] = await Promise.all([
        supabase
          .from("announcements")
          .select("id, title, body, category, published_at, pinned")
          .order("pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(4),
        supabase
          .from("events")
          .select("id, title, kind, starts_at, subjects(name)")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(4),
        supabase
          .from("subjects")
          .select("id, name, code, level, lectures(count)")
          .order("sort_order"),
        supabase
          .from("notifications")
          .select("id, title, body, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("notification_reads").select("notification_id").eq("user_id", userId!),
        supabase.from("announcement_reads").select("announcement_id").eq("user_id", userId!),
        supabase
          .from("lecture_resources")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      const lectureIds = (resourceRows.data ?? []).map((resource) => resource.lecture_id);
      const { data: lectures } = lectureIds.length
        ? await supabase
            .from("lectures")
            .select("id, title, subject_id, subjects(name)")
            .in("id", lectureIds)
        : { data: [] };
      const readIds = new Set((notificationReads.data ?? []).map((item) => item.notification_id));
      const announcementReadIds = new Set(
        (announcementReads.data ?? []).map((item) => item.announcement_id),
      );
      return {
        announcements: (announcements.data ?? []).map((item) => ({
          ...item,
          read: announcementReadIds.has(item.id),
        })),
        events: events.data ?? [],
        subjects: subjects.data ?? [],
        notifications: (notifications.data ?? []).map((item) => ({
          ...item,
          read: readIds.has(item.id),
        })),
        resources: (resourceRows.data ?? []).map((resource) => ({
          ...resource,
          lecture: (lectures ?? []).find((lecture) => lecture.id === resource.lecture_id),
        })),
      };
    },
  });
  const departmentName = useQuery({
    queryKey: ["student-department", departmentId],
    enabled: !!departmentId,
    queryFn: async () =>
      (await supabase.from("departments").select("name").eq("id", departmentId!).maybeSingle()).data
        ?.name ?? null,
  });

  async function markRead(notificationId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("notification_reads")
      .upsert(
        { notification_id: notificationId, user_id: userId },
        { onConflict: "notification_id,user_id", ignoreDuplicates: true },
      );
    if (error) toast.error("تعذّر تحديث الإشعار");
    else {
      await feed.refetch();
      queryClient.invalidateQueries({ queryKey: ["unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }
  async function markAnnouncementRead(announcementId: string) {
    if (!userId) return;
    const { error } = await supabase
      .from("announcement_reads")
      .upsert(
        { announcement_id: announcementId, user_id: userId },
        { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
      );
    if (error) toast.error("تعذّر تحديث الإعلان");
    else {
      await feed.refetch();
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    }
  }

  if (me.isLoading) return <Loading />;
  if (!me.data) return <ErrorBox />;
  const { profile, status, tg } = me.data;
  const statusInfo = statusLabel[status];

  return (
    <div className="space-y-6">
      <section className="border-b pb-5">
        <p className="text-sm text-muted-foreground">مرحبًا، {profile?.full_name || "طالب"}</p>
        <h1 className="mt-1 text-2xl font-bold">لوحتك الدراسية</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {departmentName.data && (
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
              {departmentName.data}
            </span>
          )}
          {profile?.level && (
            <span className="rounded-full bg-muted px-3 py-1">{profile.level}</span>
          )}
          <span className={`rounded-full px-3 py-1 ${statusInfo.cls}`}>
            الاشتراك: {statusInfo.text}
          </span>
        </div>
      </section>

      {!me.data.hasAccess ? (
        <Card className="border-warning/40 bg-warning-soft/40">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-bold">هناك خطوة مطلوبة لإظهار محتواك الدراسي</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tg
                  ? "فعّل اشتراكك لعرض المواد والمواعيد المخصصة لقسمك."
                  : status === "active"
                    ? "اربط Telegram لإكمال الوصول."
                    : "أكمل الاشتراك، ثم اربط Telegram من داخل المنصة."}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild>
                  <Link to={tg ? "/app/subscription" : "/app/telegram"}>
                    {tg ? "عرض الاشتراك" : "ربط Telegram"}
                  </Link>
                </Button>
                {!tg && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/app/subscription">الاشتراك</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <AccessGate status={status} linked={!!tg} />
          </div>
        </Card>
      ) : feed.isLoading ? (
        <Loading />
      ) : feed.isError ? (
        <ErrorBox text="تعذّر تحميل بيانات لوحتك. أعد المحاولة." />
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <BookOpen className="size-5 text-primary" /> موادي الدراسية
              </h2>
              <Link to="/app/subjects" className="text-sm text-primary">
                كل المواد
              </Link>
            </div>
            {!feed.data?.subjects.length ? (
              <Card>
                <p className="text-sm text-muted-foreground">لم تُضف مواد لقسمك وفرقتك بعد.</p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {feed.data?.subjects.map((subject) => (
                  <Card key={subject.id} className="h-full">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <BookOpen className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">{subject.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[subject.code, subject.level].filter(Boolean).join(" · ") ||
                            "مادة دراسية"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {(subject.lectures as unknown as { count: number }[])?.[0]?.count ?? 0}{" "}
                          محاضرة
                        </p>
                        <Button size="sm" variant="outline" className="mt-3" asChild>
                          <Link to="/app/subjects/$id" params={{ id: subject.id }}>
                            عرض المادة <ChevronLeft className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Megaphone className="size-5 text-primary" /> آخر الإعلانات
                </h2>
                <Link to="/app/announcements" className="text-sm text-primary">
                  كل الإعلانات
                </Link>
              </div>
              <div className="space-y-2">
                {!feed.data?.announcements.length && (
                  <Card>
                    <p className="text-sm text-muted-foreground">
                      لا توجد إعلانات مخصصة لك حاليًا.
                    </p>
                  </Card>
                )}
                {feed.data?.announcements.map((announcement) => (
                  <Card key={announcement.id} className={announcement.read ? "opacity-75" : ""}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {announcement.category} · {fmtDate(announcement.published_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!announcement.read && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
                            جديد
                          </span>
                        )}
                        {announcement.pinned && (
                          <span className="rounded bg-warning-soft px-2 py-0.5 text-xs text-warning">
                            مهم
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-2 font-bold">{announcement.title}</h3>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                      {announcement.body}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Button size="sm" variant="link" className="h-auto px-0" asChild>
                        <Link to="/app/announcements">عرض التفاصيل</Link>
                      </Button>
                      {!announcement.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAnnouncementRead(announcement.id)}
                        >
                          تعليم كمقروء
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <CalendarClock className="size-5 text-primary" /> الامتحانات والمواعيد القادمة
                </h2>
                <Link to="/app/schedule" className="text-sm text-primary">
                  كل المواعيد
                </Link>
              </div>
              <Card>
                <ul className="divide-y">
                  {!feed.data?.events.length && (
                    <li className="py-3 text-sm text-muted-foreground">لا توجد مواعيد قادمة.</li>
                  )}
                  {feed.data?.events.map((event) => (
                    <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {kindLabel[event.kind]}
                          {(event.subjects as { name: string } | null)?.name
                            ? ` · ${(event.subjects as { name: string }).name}`
                            : ""}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs font-semibold text-primary">
                        {fmtDate(event.starts_at, true)}
                      </time>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <FileText className="size-5 text-primary" /> أحدث الموارد
                </h2>
                <Link to="/app/subjects" className="text-sm text-primary">
                  المواد
                </Link>
              </div>
              <Card>
                <ul className="divide-y">
                  {!feed.data?.resources.length && (
                    <li className="py-3 text-sm text-muted-foreground">
                      لا توجد ملفات أو روابط جديدة بعد.
                    </li>
                  )}
                  {feed.data?.resources.map((resource) => (
                    <li key={resource.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{resource.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {resource.lecture?.title} ·{" "}
                          {(resource.lecture?.subjects as { name: string } | null)?.name}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={resource.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" /> فتح
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Bell className="size-5 text-primary" /> إشعاراتك
                </h2>
                <Link to="/app/notifications" className="text-sm text-primary">
                  كل الإشعارات
                </Link>
              </div>
              <Card>
                <ul className="divide-y">
                  {!feed.data?.notifications.length && (
                    <li className="py-3 text-sm text-muted-foreground">لا توجد إشعارات جديدة.</li>
                  )}
                  {feed.data?.notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {!notification.read && (
                            <span className="me-2 inline-block size-2 rounded-full bg-primary" />
                          )}
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {fmtDate(notification.created_at, true)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => markRead(notification.id)}>
                          مقروء
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
