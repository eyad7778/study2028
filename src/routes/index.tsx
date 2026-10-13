import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpen, CalendarClock, CreditCard, Megaphone, Send, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/site-shell";
import { useSettings } from "@/hooks/use-settings";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Campus — خدماتك الطلابية في مكان واحد" },
      { name: "description", content: "تطبيق خدمات طلابية يجمع الإعلانات والمحاضرات والمواعيد والإشعارات عبر Telegram في مكان واحد." },
      { property: "og:title", content: "Smart Campus — خدماتك الطلابية في مكان واحد" },
      { property: "og:description", content: "الإعلانات والمحاضرات والمواعيد والإشعارات في تطبيق واحد بدل المجموعات المتفرقة." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Megaphone, title: "الإعلانات أولًا بأول", text: "أخبار وإعلانات منظّمة بدل البحث في عشرات المجموعات." },
  { icon: BookOpen, title: "المواد والمحاضرات", text: "ملفات كل مادة مرتبة حسب الأسبوع وجاهزة للتحميل." },
  { icon: CalendarClock, title: "المواعيد والامتحانات", text: "جدول المحاضرات والامتحانات والتكليفات في مكان واحد." },
  { icon: Bell, title: "إشعارات فورية", text: "تنبيهات داخل التطبيق وعلى Telegram لكل جديد يخصك." },
];

const steps = [
  { icon: UserPlus, title: "أنشئ حسابك", text: "بالاسم ورقم الهاتف وكلمة مرور." },
  { icon: CreditCard, title: "فعّل اشتراكك", text: "ادفع بإحدى الطرق المتاحة وأرسل بيانات العملية للمراجعة." },
  { icon: Send, title: "اربط Telegram", text: "بضغطة واحدة لتصلك الإشعارات مباشرة." },
  { icon: ShieldCheck, title: "ابدأ الاستخدام", text: "وصول كامل للمحتوى طوال مدة الاشتراك." },
];

function Index() {
  const { data: s } = useSettings();
  return (
    <PublicLayout>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
              لطلاب معهد الفراعنة العالي للحاسب ونظم المعلومات والإدارة
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
              حياتك الدراسية، <span className="text-primary">في مكان واحد</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-8 text-muted-foreground">
              Smart Campus يجمع الإعلانات والمحاضرات والمواعيد والإشعارات، ويريحك من فوضى مجموعات الواتساب والتليجرام المتفرقة.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/signup">إنشاء حساب مجاني</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">لدي حساب</Link></Button>
            </div>
          </div>
          <img src={hero} alt="واجهة تطبيق Smart Campus على الهاتف" width={1024} height={896} className="mx-auto w-full max-w-md" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold md:text-3xl">ماذا يقدم لك التطبيق؟</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><f.icon className="size-5" /></span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold md:text-3xl">كيف تبدأ؟</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {steps.map((st, i) => (
              <li key={st.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
                  <st.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-3 font-bold">{st.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{st.text}</p>
              </li>
            ))}
          </ol>
          {s && (
            <p className="mt-8 rounded-xl bg-primary-soft px-4 py-3 text-sm text-accent-foreground">
              الاشتراك الحالي: <b>{s.subscription_price} {s.currency}</b> لمدة <b>{s.subscription_days} يومًا</b>.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl bg-navy p-8 text-primary-foreground md:p-12">
          <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">تحتاج مساعدة؟</h2>
          <p className="mt-2 opacity-80">فريق الدعم متاح للرد على استفساراتك حول الحساب والاشتراك.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {s?.support_phone && <span className="rounded-lg bg-primary-foreground/10 px-3 py-2" dir="ltr">{s.support_phone}</span>}
            {s?.support_email && <span className="rounded-lg bg-primary-foreground/10 px-3 py-2" dir="ltr">{s.support_email}</span>}
            {s?.support_telegram && <span className="rounded-lg bg-primary-foreground/10 px-3 py-2" dir="ltr">{s.support_telegram}</span>}
            {!s?.support_phone && !s?.support_email && !s?.support_telegram && (
              <span className="opacity-70">ستُضاف بيانات التواصل قريبًا من الإدارة.</span>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
