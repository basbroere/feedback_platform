import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, UserMinus } from "lucide-react";
import { requirePersona } from "@/lib/persona/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/one-on-one/person-avatar";
import { listOffboardedUsers } from "@/lib/hr/offboarding-queries";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/hr/roles";

export default async function UitDienstOverzichtPage() {
  const persona = await requirePersona();
  if (!persona.is_admin) redirect("/dashboard");

  const users = await listOffboardedUsers();

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <Link
          href="/beheer"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Terug naar beheer
        </Link>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
          Uit dienst
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Medewerkers die in de afgelopen twee jaar uit dienst zijn gegaan. Klik
          op een naam voor het dossier met alle gesprekken, actiepunten en
          feedback.
        </p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-0">
          <span className="text-[15px] font-semibold">Ex-medewerkers</span>
          <Badge variant="outline" className="ml-1">
            {users.length}
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <UserMinus className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="space-y-1">
                <p className="text-[14px] font-medium text-foreground">
                  Nog niemand uit dienst
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Wanneer een medewerker uit dienst gaat verschijnt hier het
                  dossier.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border/70 text-[12.5px] font-medium font-heading text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Naam</th>
                    <th className="py-2 pr-3 font-medium">Rol</th>
                    <th className="py-2 pr-3 font-medium">Team</th>
                    <th className="py-2 pr-3 font-medium">Uit dienst</th>
                    <th className="py-2 text-right font-medium">Dossier</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/beheer/uitdienst/${u.id}`}
                          className="flex items-center gap-2.5"
                        >
                          <PersonAvatar
                            id={u.id}
                            name={u.name}
                            avatarUrl={u.avatar_url}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-foreground">
                              {u.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {ROLE_LABEL[u.role]}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {u.team_name ?? (
                          <span className="text-foreground/40">Geen team</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {formatDate(u.left_at)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/beheer/uitdienst/${u.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground/70 hover:text-foreground"
                        >
                          Bekijk
                          <ArrowRight
                            className="h-3.5 w-3.5"
                            strokeWidth={1.75}
                          />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
