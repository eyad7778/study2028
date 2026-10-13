import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Inbox, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubStatus } from "@/hooks/use-me";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-5 shadow-card ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Loading() {
  return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-primary" aria-label="جارِ التحميل" /></div>;
}

export function ErrorBox({ text = "تعذّر تحميل البيانات. حاول مرة أخرى." }: { text?: string }) {
  return <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{text}</p>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <Inbox className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function AccessGate({ status, linked }: { status: SubStatus; linked: boolean }) {
  const needSub = status !== "active";
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <Lock className="mx-auto size-8 text-primary" />
      <p className="mt-3 font-bold">هذا المحتوى للمشتركين</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {needSub ? "فعّل اشتراكك أولًا للوصول إلى المحتوى الدراسي." : linked ? "" : "خطوة أخيرة: اربط حساب Telegram لفتح المحتوى."}
      </p>
      <Button asChild className="mt-5">
        {needSub ? <Link to="/app/subscription">الاشتراك</Link> : <Link to="/app/telegram">ربط Telegram</Link>}
      </Button>
    </div>
  );
}

export const kindLabel: Record<string, string> = { lecture: "محاضرة", exam: "امتحان", assignment: "تكليف", other: "موعد" };

export function fmtDate(d: string | null | undefined, withTime = false) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-EG", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}
