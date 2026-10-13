import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { PublicLayout } from "@/components/site-shell";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/designer")({
  head: () => ({
    meta: [
      { title: "مصمم التطبيق — Smart Campus" },
      { name: "description", content: "نبذة عن مصمم ومطوّر تطبيق Smart Campus." },
      { property: "og:title", content: "مصمم تطبيق Smart Campus" },
      { property: "og:description", content: "تعرّف على صاحب فكرة Smart Campus ومطوّره." },
    ],
  }),
  component: Designer,
});

function Designer() {
  const { data: s } = useSettings();
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <span className="mx-auto grid size-24 place-items-center rounded-full bg-primary-soft text-primary">
          <UserRound className="size-10" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold">{s?.designer_name || "مصمم التطبيق"}</h1>
        <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{s?.designer_bio}</p>
        {s?.designer_contact && <p className="mt-6 text-sm" dir="ltr">{s.designer_contact}</p>}
      </div>
    </PublicLayout>
  );
}
