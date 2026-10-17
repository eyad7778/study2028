import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { useSettings } from "@/hooks/use-settings";
import { createTelegramLink } from "@/lib/student.functions";
import { Card, ErrorBox, fmtDate, Loading, PageTitle } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/app/telegram")({
  head: () => ({
    meta: [
      { title: "ربط Telegram — Smart Student" },
      { name: "description", content: "اربط حسابك بـ Telegram لتصلك الإشعارات." },
      { property: "og:title", content: "ربط Telegram — Smart Student" },
      { property: "og:description", content: "استقبل إشعارات Smart Student على Telegram." },
    ],
  }),
  component: TelegramPage,
});

const sendLabel: Record<string, string> = { sent: "تم الإرسال", failed: "فشل الإرسال", blocked: "البوت محظور من طرفك" };

function TelegramPage() {
  const me = useMe();
  const settings = useSettings();
  const qc = useQueryClient();
  const create = useServerFn(createTelegramLink);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [opened, setOpened] = useState(false);

  if (me.isLoading) return <Loading />;
  if (!me.data) return <ErrorBox />;
  const { tg, status, isStaff } = me.data;

  async function link() {
    setErr("");
    setBusy(true);
    const r = await create().catch(() => ({ error: "تعذّر الاتصال بالخادم." }));
    setBusy(false);
    if ("error" in r && r.error) return setErr(r.error);
    if ("url" in r && r.url) {
      window.open(r.url, "_blank", "noopener");
      setOpened(true);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="ربط Telegram" subtitle="الربط إلزامي لتصلك إشعارات المحاضرات والإعلانات والامتحانات." />
      {tg ? (
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-success" />
            <div>
              <p className="font-bold">حسابك مرتبط</p>
              <p className="text-sm text-muted-foreground">منذ {fmtDate(tg.linked_at, true)}{tg.telegram_username ? ` · @${tg.telegram_username}` : ""}</p>
            </div>
          </div>
          {tg.last_send_status && (
            <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${tg.last_send_status === "sent" ? "bg-success-soft text-success" : "bg-destructive/10 text-destructive"}`}>
              آخر إرسال: {sendLabel[tg.last_send_status] ?? tg.last_send_status} · {fmtDate(tg.last_send_at, true)}
            </p>
          )}
          {tg.blocked && <p className="mt-3 text-sm text-muted-foreground">افتح البوت في Telegram واضغط «إلغاء الحظر» ثم Start لتعود الإشعارات.</p>}
          <Button variant="outline" className="mt-5" onClick={link} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} إعادة الربط بحساب آخر
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">فصل الربط يتم عن طريق الإدارة فقط.</p>
        </Card>
      ) : status !== "active" && !isStaff ? (
        <Card className="text-center">
          <p className="font-semibold">فعّل اشتراكك أولًا</p>
          <p className="mt-1 text-sm text-muted-foreground">يظهر زر الربط بعد تفعيل الاشتراك من الإدارة.</p>
          <Button asChild className="mt-4"><Link to="/app/subscription">صفحة الاشتراك</Link></Button>
        </Card>
      ) : (
        <Card>
          <ol className="space-y-3 text-sm leading-7">
            <li>1. اضغط الزر بالأسفل ليفتح بوت المشروع في Telegram.</li>
            <li>2. اضغط <b>Start</b> داخل المحادثة.</li>
            <li>3. ستصلك رسالة تأكيد، ثم ارجع هنا واضغط «تحديث الحالة».</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">رابط الربط صالح لمدة 15 دقيقة ولمرة واحدة فقط.</p>
          {err && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="lg" onClick={link} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} ربط حساب Telegram</Button>
            {opened && <Button size="lg" variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["me"] })}>تحديث الحالة</Button>}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            تواجه مشكلة؟ تواصل مع الدعم{settings.data?.support_telegram ? `: ${settings.data.support_telegram}` : settings.data?.support_phone ? `: ${settings.data.support_phone}` : "."}
          </p>
        </Card>
      )}
    </div>
  );
}
