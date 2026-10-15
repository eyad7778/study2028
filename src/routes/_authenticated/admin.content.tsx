import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Card, fmtDate, kindLabel, PageTitle } from "@/components/app-ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => pageMeta("إدارة المحتوى", "المواد والمحاضرات والملفات والمواعيد."),
  component: Content,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Content() {
  const qc = useQueryClient();
  const subjects = useQuery({ queryKey: ["admin-subjects"], queryFn: async () => (await supabase.from("subjects").select("*").order("sort_order")).data ?? [] });
  const [subj, setSubj] = useState({ name: "", code: "", level: "", term: "" });
  const [lec, setLec] = useState({ subject_id: "", title: "", week: "", description: "", external_url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [ev, setEv] = useState({ subject_id: "", title: "", kind: "lecture", starts_at: "", location: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("");
  const lectures = useQuery({ queryKey: ["admin-lectures", view], enabled: !!view, queryFn: async () => (await supabase.from("lectures").select("*").eq("subject_id", view).order("created_at")).data ?? [] });
  const events = useQuery({ queryKey: ["admin-events"], queryFn: async () => (await supabase.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(50)).data ?? [] });

  const done = (ok: string, error: unknown) => { setBusy(false); if (error) toast.error("تعذّر الحفظ"); else { toast.success(ok); qc.invalidateQueries(); } return !error; };

  async function addSubject(e: FormEvent) {
    e.preventDefault();
    if (subj.name.trim().length < 2) { toast.error("اكتب اسم المادة"); return; }
    setBusy(true);
    const { error } = await supabase.from("subjects").insert({ name: subj.name.trim(), code: subj.code || null, level: subj.level || null, term: subj.term || null, sort_order: (subjects.data?.length ?? 0) + 1 });
    if (done("تمت إضافة المادة", error)) setSubj({ name: "", code: "", level: "", term: "" });
  }
  async function addLecture(e: FormEvent) {
    e.preventDefault();
    if (!lec.subject_id || lec.title.trim().length < 2) { toast.error("اختر المادة واكتب العنوان"); return; }
    if (file && file.size > 50 * 1024 * 1024) { toast.error("الحد الأقصى للملف 50 ميجابايت"); return; }
    setBusy(true);
    let file_path: string | null = null;
    if (file) {
      const path = `${lec.subject_id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("lectures").upload(path, file);
      if (up.error) { setBusy(false); { toast.error("تعذّر رفع الملف"); return; } }
      file_path = path;
    }
    const { error } = await supabase.from("lectures").insert({ subject_id: lec.subject_id, title: lec.title.trim(), week: lec.week ? Number(lec.week) : null, description: lec.description || null, external_url: lec.external_url || null, file_path });
    if (done("تمت إضافة المحاضرة", error)) { setLec({ ...lec, title: "", week: "", description: "", external_url: "" }); setFile(null); }
  }
  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (ev.title.trim().length < 2 || !ev.starts_at) { toast.error("اكتب العنوان والموعد"); return; }
    setBusy(true);
    const { error } = await supabase.from("events").insert({ title: ev.title.trim(), kind: ev.kind as "lecture", starts_at: new Date(ev.starts_at).toISOString(), subject_id: ev.subject_id || null, location: ev.location || null, notes: ev.notes || null });
    if (done("تمت إضافة الموعد", error)) setEv({ ...ev, title: "", starts_at: "", location: "", notes: "" });
  }
  async function delLecture(id: string, path: string | null) {
    if (!confirm("حذف المحاضرة؟")) return;
    if (path) await supabase.storage.from("lectures").remove([path]);
    await supabase.from("lectures").delete().eq("id", id);
    qc.invalidateQueries();
  }
  async function delRow(table: "events" | "subjects", id: string) {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف (قد تكون مرتبطة بمحاضرات)");
    qc.invalidateQueries();
  }

  const opts = (subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>);
  return (
    <div>
      <PageTitle title="المحتوى الدراسي" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-bold">مادة جديدة</h2>
          <form onSubmit={addSubject} className="mt-3 space-y-2">
            <Input placeholder="اسم المادة" value={subj.name} onChange={(e) => setSubj({ ...subj, name: e.target.value })} />
            <Input placeholder="الكود" value={subj.code} onChange={(e) => setSubj({ ...subj, code: e.target.value })} />
            <Input placeholder="الفرقة" value={subj.level} onChange={(e) => setSubj({ ...subj, level: e.target.value })} />
            <Input placeholder="الترم" value={subj.term} onChange={(e) => setSubj({ ...subj, term: e.target.value })} />
            <Button disabled={busy} className="w-full">إضافة</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-bold">محاضرة / ملف</h2>
          <form onSubmit={addLecture} className="mt-3 space-y-2">
            <select className={sel} value={lec.subject_id} onChange={(e) => setLec({ ...lec, subject_id: e.target.value })}><option value="">اختر المادة…</option>{opts}</select>
            <Input placeholder="العنوان" value={lec.title} onChange={(e) => setLec({ ...lec, title: e.target.value })} />
            <Input type="number" placeholder="رقم الأسبوع" value={lec.week} onChange={(e) => setLec({ ...lec, week: e.target.value })} />
            <Input placeholder="وصف مختصر" value={lec.description} onChange={(e) => setLec({ ...lec, description: e.target.value })} />
            <Input dir="ltr" placeholder="رابط خارجي (اختياري)" value={lec.external_url} onChange={(e) => setLec({ ...lec, external_url: e.target.value })} />
            <Label className="text-xs">ملف (PDF أو غيره)</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button disabled={busy} className="w-full">إضافة</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-bold">موعد / امتحان</h2>
          <form onSubmit={addEvent} className="mt-3 space-y-2">
            <select className={sel} value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })}>{Object.entries(kindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className={sel} value={ev.subject_id} onChange={(e) => setEv({ ...ev, subject_id: e.target.value })}><option value="">بدون مادة</option>{opts}</select>
            <Input placeholder="العنوان" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} />
            <Input type="datetime-local" value={ev.starts_at} onChange={(e) => setEv({ ...ev, starts_at: e.target.value })} />
            <Input placeholder="المكان" value={ev.location} onChange={(e) => setEv({ ...ev, location: e.target.value })} />
            <Input placeholder="ملاحظات" value={ev.notes} onChange={(e) => setEv({ ...ev, notes: e.target.value })} />
            <Button disabled={busy} className="w-full">إضافة</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="font-bold">المواد</h2>
        <ul className="mt-2 divide-y text-sm">
          {(subjects.data ?? []).map((s) => (
            <li key={s.id} className="py-2">
              <div className="flex items-center justify-between gap-2">
                <button className="text-start font-semibold text-primary" onClick={() => setView(view === s.id ? "" : s.id)}>{s.name}</button>
                <Button size="sm" variant="ghost" onClick={() => delRow("subjects", s.id)}>حذف</Button>
              </div>
              {view === s.id && (
                <ul className="mt-2 space-y-1 ps-4 text-xs">
                  {(lectures.data ?? []).length === 0 && <li className="text-muted-foreground">لا محاضرات</li>}
                  {(lectures.data ?? []).map((l) => (
                    <li key={l.id} className="flex items-center justify-between">{l.title}{l.file_path ? " 📎" : ""}<Button size="sm" variant="ghost" onClick={() => delLecture(l.id, l.file_path)}>حذف</Button></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-4">
        <h2 className="font-bold">المواعيد القادمة</h2>
        <ul className="mt-2 divide-y text-sm">
          {(events.data ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2"><span>{kindLabel[e.kind]}: {e.title} · {fmtDate(e.starts_at, true)}</span><Button size="sm" variant="ghost" onClick={() => delRow("events", e.id)}>حذف</Button></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
