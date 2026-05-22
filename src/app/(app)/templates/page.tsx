import { notFound } from "next/navigation";
import { Archive, Sliders } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import {
  listAllTemplates,
  TEMPLATE_TYPE_LABEL,
  type ManagedTemplate,
  type TemplateType,
} from "@/lib/templates/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { TemplateRowActions } from "@/components/templates/template-row-actions";

const TYPE_ORDER: TemplateType[] = [
  "peer_360",
  "one_on_one",
  "evaluation",
  "performance_review",
];

export default async function TemplatesPage() {
  const persona = await requirePersona();
  if (persona.role !== "hr") notFound();

  const templates = await listAllTemplates();
  const grouped = new Map<TemplateType, ManagedTemplate[]>();
  for (const t of templates) {
    const list = grouped.get(t.type) ?? [];
    list.push(t);
    grouped.set(t.type, list);
  }

  return (
    <div className="space-y-8">
      <PageTitle
        icon={Sliders}
        tone="sky"
        title="Templates"
        subtitle={`${templates.length} beschikbaar`}
        action={<TemplateEditorDialog mode="create" triggerLabel="Nieuw template" />}
      />

      <div className="space-y-8">
        {TYPE_ORDER.map((type) => {
          const items = grouped.get(type) ?? [];
          if (type === "performance_review" && items.length === 0) return null;
          return (
            <section key={type} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {TEMPLATE_TYPE_LABEL[type]}
                </h2>
                <span className="text-[12px] text-muted-foreground">
                  {items.length} {items.length === 1 ? "template" : "templates"}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-8 text-center text-sm text-muted-foreground">
                  Nog geen template voor dit type.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((t) => (
                    <li key={t.id}>
                      <TemplateCard template={t} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: ManagedTemplate }) {
  const ratingCount = template.questions.filter(
    (q) => q.kind === "rating_b_1_5",
  ).length;
  const openCount = template.questions.filter((q) => q.kind === "open").length;

  return (
    <Card className={template.is_active ? "" : "opacity-60"}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-[15px]">
              {template.name}
              {!template.is_active ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Archive className="h-3 w-3" />
                  Gearchiveerd
                </span>
              ) : null}
            </CardTitle>
            <p className="text-[12.5px] text-muted-foreground">
              {template.questions.length}{" "}
              {template.questions.length === 1 ? "vraag" : "vragen"}
              {ratingCount > 0 ? ` · ${ratingCount} B-rating` : ""}
              {openCount > 0 ? ` · ${openCount} open` : ""}
              {template.usage_count > 0
                ? ` · ${template.usage_count}x in gebruik`
                : ""}
            </p>
          </div>
          <TemplateRowActions template={template} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 text-[13px] text-foreground/75">
          {template.questions.slice(0, 4).map((q) => (
            <li key={q.id} className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {kindShortLabel(q.kind)}
              </span>
              <span>{q.label}</span>
            </li>
          ))}
          {template.questions.length > 4 ? (
            <li className="text-muted-foreground">
              +{template.questions.length - 4} meer
            </li>
          ) : null}
        </ul>
      </CardContent>
    </Card>
  );
}

function kindShortLabel(kind: ManagedTemplate["questions"][number]["kind"]) {
  switch (kind) {
    case "rating_b_1_5":
      return "B-rating";
    case "scale_1_5":
      return "Schaal";
    case "choice_single":
      return "Keuze";
    case "choice_multi":
      return "Meerkeuze";
    default:
      return "Open";
  }
}
