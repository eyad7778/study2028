import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { statusLabel, useMe } from "@/hooks/use-me";
import { useSettings } from "@/hooks/use-settings";
import { Card, ErrorBox, fmtDate, Loading, PageTitle } from "@/components/app-ui";

export const Route = createFileRoute("/_authenticated/app/subscription")({
  head: () => ({
    meta: [
      { title: "الاشتراك — Smart Student" },
      { name: "description", content: "سعر الاشتراك وطرق الدفع وحالة طلبك." },
      { property: "og:title", content: "الاشتراك — Smart Student" },
      { property: "og:description", content: "فعّل اشتراكك في Smart Student." },
    ],
  }),
  component: Subscription,
});

const prLabel = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" } as const;

function Subscription() {
  const me = useMe();
  const settings = useSettings();
  const qc = useQueryClient();
  const requests = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => (await supabase.from("payment_requests").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (me.isLoading || settings.isLoading) return <Loading />;
  if (!me.data || !settings.data) return <ErrorBox />;
  const s = settings.data;
  const st = statusLabel[me.data.status];
  const hasPending = (requests.data ?? []).some((r) => r.status === "pending");
  const canSubmit = !hasPending && me.data.status !== "suspended";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!method) return setErr("اختر طريقة الدفع.");
    if (reference.trim().length < 3) return setErr("اكتب رقم العملية أو الرقم المحوَّل منه.");
    if (file && file.size > 5 * 1024 * 1024) return setErr("حجم الإيصال يجب ألا يتجاوز 5 ميجابايت.");
    setBusy(true);
    let receipt_path: string | null = null;
    if (file) {
      const path = `${me.data!.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("receipts").upload(path, file);
      if (up.error) { setBusy(false); return setErr("تعذّر رفع الإيصال، حاول مرة أخرى."); }
      receipt_path = path;
    }
    const { error } = await supabase.from("payment_requests").insert({ user_id: me.data!.id, amount: s!.subscription_price, method, reference: reference.trim(), receipt_path });
    setBusy(false);
    if (error) return setErr("تعذّر إرسال الطلب، حاول مرة أخرى.");
    toast.success("تم إرسال طلبك للمراجعة");
    setReference(""); setFile(null);
    qc.invalidateQueries();
  }

  return (
    <div>
      <PageTitle title="الاشتراك" subtitle="فعّل اشتراكك للوصول إلى المحتوى الدراسي." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted-foreground">حالة اشتراكك</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${st.cls}`}>{st.text}</span>
          {me.data.sub?.end_at && <p className="mt-3 text-sm">تاريخ الانتهاء: <b>{fmtDate(me.data.sub.end_at)}</b></p>}
          {me.data.status === "suspended" && <p className="mt-3 text-sm text-destructive">اشتراكك موقوف. تواصل مع الإدارة.</p>}
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">سعر الاشتراك</p>
          <p className="mt-1 text-3xl font-extrabold text-navy">{s.subscription_price} <span className="text-base font-semibold">{s.currency}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">لمدة {s.subscription_days} يومًا</p>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="font-bold">طرق الدفع</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {s.payment_methods.map((m) => (
            <li key={m.name} className="rounded-xl bg-muted px-4 py-3 text-sm"><b>{m.name}</b><span className="block text-muted-foreground" dir="auto">{m.details}</span></li>
          ))}
        </ul>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{s.payment_instructions}</p>
      </Card>

      {canSubmit ? (
        <Card className="mt-4">
          <h2 className="font-bold">إرسال بيانات الدفع</h2>
          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
            <div className="space-y-2">
              <Label htmlFor="method">طريقة الدفع</Label>
              <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">اختر…</option>
                {s.payment_methods.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">رقم العملية / الرقم المحوَّل منه</Label>
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} dir="auto" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="receipt">صورة الإيصال (اختياري)</Label>
              <Input id="receipt" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {err && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2">{err}</p>}
            <Button type="submit" disabled={busy} className="sm:col-span-2">{busy && <Loader2 className="size-4 animate-spin" />} إرسال للمراجعة</Button>
          </form>
        </Card>
      ) : hasPending && (
        <p className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">لديك طلب قيد المراجعة. سيصلك إشعار عند البت فيه.</p>
      )}

      {(requests.data ?? []).length > 0 && (
        <Card className="mt-4">
          <h2 className="font-bold">طلباتك السابقة</h2>
          <ul className="mt-3 divide-y text-sm">
            {requests.data!.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span>{r.method} · {r.amount} · <span dir="auto">{r.reference}</span></span>
                <span className="text-muted-foreground">{prLabel[r.status]} · {fmtDate(r.created_at)}</span>
                {r.review_note && <span className="w-full text-xs text-muted-foreground">ملاحظة الإدارة: {r.review_note}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
