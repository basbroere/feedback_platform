import { notFound } from "next/navigation";
import { Sliders } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { listAllTemplates } from "@/lib/templates/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { TemplatesTable } from "@/components/templates/templates-table";

export default async function TemplatesPage() {
  const persona = await requirePersona();
  if (!persona.is_admin) notFound();

  const templates = await listAllTemplates();
  const activeCount = templates.filter((t) => t.is_active).length;

  return (
    <div className="space-y-8">
      <PageTitle
        icon={Sliders}
        tone="sky"
        title="Templates"
        subtitle={`${activeCount} actief`}
        action={<TemplateEditorDialog mode="create" triggerLabel="Nieuw template" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Alle templates
            <Badge variant="outline" className="ml-1">
              {activeCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplatesTable templates={templates} />
        </CardContent>
      </Card>
    </div>
  );
}
