import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site-shell";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن المشروع — Smart Campus" },
      { name: "description", content: "تعرّف على فكرة Smart Campus وهدفه في تنظيم الحياة الدراسية للطلاب." },
      { property: "og:title", content: "عن مشروع Smart Campus" },
      { property: "og:description", content: "تطبيق خدمات طلابية مستقل يجمع المحتوى الدراسي والإعلانات والإشعارات." },
    ],
  }),
  component: About,
});

function About() {
  const { data: s } = useSettings();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-extrabold">عن المشروع</h1>
        <p className="mt-6 whitespace-pre-line text-lg leading-9 text-muted-foreground">{s?.about_text}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="font-bold">ما هو التطبيق</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">مساعد للحياة الدراسية اليومية: إعلانات، ملفات، مواعيد، وتنبيهات.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="font-bold">ما ليس عليه</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">ليس منصة كورسات ولا نظامًا رسميًا لإدارة المعهد أو الدكاترة.</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
