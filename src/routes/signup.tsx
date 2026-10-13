import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth-card";
import { supabase } from "@/integrations/supabase/client";
import { authErrorAr, isValidEgyptPhone, normalizePhone, phoneToEmail } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب — Smart Campus" },
      { name: "description", content: "أنشئ حسابك الطلابي في Smart Campus خلال دقيقة." },
      { property: "og:title", content: "إنشاء حساب — Smart Campus" },
      { property: "og:description", content: "انضم إلى Smart Campus برقم هاتفك." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    const p = normalizePhone(form.phone);
    if (name.length < 5 || !name.includes(" ")) return setError("اكتب اسمك الكامل (الاسم الأول واسم العائلة على الأقل).");
    if (!isValidEgyptPhone(p)) return setError("أدخل رقم هاتف مصري صحيح مثل 01012345678.");
    if (form.password.length < 8) return setError("كلمة المرور يجب ألا تقل عن 8 أحرف.");
    if (form.password !== form.confirm) return setError("كلمتا المرور غير متطابقتين.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(p),
      password: form.password,
      options: { data: { full_name: name, phone: p }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return setError(authErrorAr(error.message));
    if (!data.session) return setError("تم إنشاء الحساب. سجّل الدخول الآن.");
    navigate({ to: "/app" });
  }

  return (
    <AuthCard
      title="إنشاء حساب جديد"
      subtitle="خطوة واحدة وتبدأ رحلتك مع Smart Campus."
      footer={<>لديك حساب بالفعل؟ <Link to="/login" className="font-semibold text-primary">سجّل الدخول</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">الاسم الكامل</Label>
          <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" inputMode="tel" dir="ltr" className="text-right" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="01xxxxxxxxx" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} required />
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} إنشاء الحساب
        </Button>
      </form>
    </AuthCard>
  );
}
