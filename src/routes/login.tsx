import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth-card";
import { supabase } from "@/integrations/supabase/client";
import { authErrorAr, isValidEgyptPhone, normalizePhone, phoneToEmail } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Smart Campus" },
      { name: "description", content: "سجّل دخولك إلى Smart Campus برقم هاتفك." },
      { property: "og:title", content: "تسجيل الدخول — Smart Campus" },
      { property: "og:description", content: "ادخل إلى حسابك الطلابي." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const p = normalizePhone(phone);
    if (!isValidEgyptPhone(p)) return setError("أدخل رقم هاتف مصري صحيح مثل 01012345678.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(p), password });
    setLoading(false);
    if (error) return setError(authErrorAr(error.message));
    navigate({ to: "/app" });
  }

  return (
    <AuthCard
      title="أهلًا بعودتك"
      subtitle="سجّل الدخول برقم هاتفك وكلمة المرور."
      footer={<>ليس لديك حساب؟ <Link to="/signup" className="font-semibold text-primary">أنشئ حسابًا</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" inputMode="tel" dir="ltr" className="text-right" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} دخول
        </Button>
        <p className="text-center text-xs text-muted-foreground">نسيت كلمة المرور؟ تواصل مع الدعم لإعادة تعيينها.</p>
      </form>
    </AuthCard>
  );
}
